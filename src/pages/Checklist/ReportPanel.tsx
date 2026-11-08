import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  X,
  Mail,
} from 'lucide-react';
import { LIMITS, validateReportForm } from '../../utils/validation';

export interface ReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  aircraftSlug: string;
  aircraftName: string;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

type PanelState = 'expanded' | 'collapsed';

const STORAGE_KEY_PREFIX = 'report_draft_';

interface DraftData {
  details: string;
  email: string;
  showEmail: boolean;
}

function loadDraft(slug: string): DraftData | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${slug}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return null;
}

function saveDraft(slug: string, data: DraftData) {
  try {
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, JSON.stringify(data));
  } catch {
    /* noop */
  }
}

function clearDraft(slug: string) {
  try {
    sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${slug}`);
  } catch {
    /* noop */
  }
}

const ReportPanel: React.FC<ReportPanelProps> = ({
  isOpen,
  onClose,
  aircraftSlug,
  aircraftName,
  triggerRef,
}) => {
  const [panelState, setPanelState] = useState<PanelState>('expanded');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const [issue, setIssue] = useState<{ number: number; url: string } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load draft from sessionStorage when the panel opens (or the aircraft changes while open).
  // Adjusting state during render avoids a second render pass from an effect.
  const openFor = isOpen ? aircraftSlug : null;
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if (openFor !== loadedFor) {
    setLoadedFor(openFor);
    if (openFor) {
      const draft = loadDraft(openFor);
      if (draft) {
        setDetails(draft.details);
        setEmail(draft.email);
        setShowEmail(draft.showEmail);
      }
      setPanelState('expanded');
      setStatus('idle');
      setServerError('');
      setIssue(null);
    }
  }

  // Persist draft to sessionStorage on change
  useEffect(() => {
    if (isOpen && status === 'idle') {
      saveDraft(aircraftSlug, { details, email, showEmail });
    }
  }, [details, email, showEmail, isOpen, aircraftSlug, status]);

  const handleSubmit = async () => {
    const trimmed = details.trim();
    const errors = validateReportForm({ details: trimmed, email: showEmail ? email : '' });
    const firstError = errors.details ?? errors.email;
    if (firstError) {
      setServerError(firstError);
      setStatus('error');
      return;
    }

    setServerError('');
    setStatus('submitting');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aircraft: aircraftSlug,
          details: trimmed,
          email: showEmail ? email.trim() : '',
          _honeypot: honeypot,
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setStatus('success');
        clearDraft(aircraftSlug);
        setDetails('');
        setEmail('');
        setShowEmail(false);
        if (json.url) {
          // Stays open so the reporter can follow the issue link.
          setIssue({ number: json.issue, url: json.url });
        } else {
          setTimeout(onClose, 2000);
        }
      } else {
        setServerError(json.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setServerError("Couldn't save your report. Please try again in a moment.");
      setStatus('error');
    }
  };

  const togglePanel = () => {
    setPanelState((prev) => (prev === 'expanded' ? 'collapsed' : 'expanded'));
  };

  // Focus the textarea on open, Escape to dismiss, return focus on close
  useEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef?.current;
    // Focus the textarea (first interactive input) after panel animates in
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      } else {
        closeButtonRef.current?.focus();
      }
    }, 100);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Focus trap: cycle focus within the panel
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handler);
      // Return focus to the trigger button
      trigger?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  const hasDraft = details.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          role="dialog"
          aria-modal="true"
          aria-label="Report an issue"
          ref={panelRef}
          className="
                        fixed bottom-0 left-0 right-0 z-overlay
                        md:left-auto md:right-4 md:bottom-4 md:w-[28rem]
                    "
        >
          <div
            className="
                        bg-surface border-t border-x border-border mx-2
                        md:mx-0 md:border
                        max-h-[80vh] overflow-y-auto
                    "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-raised/30">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle
                  size={14}
                  aria-hidden="true"
                  className="text-warning flex-shrink-0"
                />
                <span className="type-subheading text-primary truncate">
                  {panelState === 'collapsed' && hasDraft
                    ? 'Report in progress...'
                    : 'Report Inaccuracy'}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={togglePanel}
                  className="p-1.5 text-muted hover:text-primary transition-colors"
                  aria-label={panelState === 'expanded' ? 'Collapse' : 'Expand'}
                >
                  {panelState === 'expanded' ? (
                    <ChevronDown size={16} aria-hidden="true" />
                  ) : (
                    <ChevronUp size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="p-1.5 text-muted hover:text-primary transition-colors"
                  aria-label="Close"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Expandable Content */}
            <AnimatePresence initial={false}>
              {panelState === 'expanded' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  {status === 'success' ? (
                    <div role="status" className="px-4 py-8 flex flex-col items-center text-center">
                      <CheckCircle2 size={40} aria-hidden="true" className="text-success mb-3" />
                      <p className="text-sm text-primary font-medium">
                        {issue ? `Filed as issue #${issue.number}` : 'Report submitted'}
                      </p>
                      <p className="text-xs text-muted mt-1 max-w-[18rem]">
                        {issue
                          ? 'We’re checking it now. The details appear on GitHub in a minute or two; follow the issue to hear when it’s fixed.'
                          : 'Thanks for the feedback.'}
                      </p>
                      {issue && (
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 border border-border text-xs text-primary hover:border-accent transition-colors"
                        >
                          <span>Track on GitHub</span>
                          <ArrowUpRight size={12} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-4 space-y-3">
                      {/* Honeypot */}
                      <div
                        className="absolute opacity-0 z-behind pointer-events-none"
                        aria-hidden="true"
                      >
                        <input
                          type="text"
                          name="_hp"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                        />
                      </div>

                      {/* Aircraft (read-only) */}
                      <div className="text-xs text-muted">
                        Aircraft: <span className="text-primary">{aircraftName}</span>
                      </div>

                      {/* Details textarea — bigger, no counter */}
                      <label htmlFor="report-details" className="sr-only">
                        Issue details
                      </label>
                      <textarea
                        id="report-details"
                        ref={textareaRef}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        rows={6}
                        maxLength={LIMITS.reportDetails.max}
                        aria-invalid={status === 'error' && !!serverError}
                        aria-describedby={
                          status === 'error' && serverError ? 'report-error' : undefined
                        }
                        className="w-full bg-base border border-border p-3 text-primary text-sm focus:border-accent transition-colors placeholder:text-faint resize-none"
                        placeholder="Describe the issue or suggestion..."
                      />

                      {/* Email (expandable) */}
                      {!showEmail ? (
                        <button
                          type="button"
                          onClick={() => setShowEmail(true)}
                          className="flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors"
                        >
                          <Mail size={12} aria-hidden="true" />
                          <span>Add email for follow-up</span>
                        </button>
                      ) : (
                        <div className="space-y-1.5">
                          <label htmlFor="report-email" className="sr-only">
                            Email for follow-up
                          </label>
                          <input
                            id="report-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            maxLength={LIMITS.email.max}
                            className="w-full bg-base border border-border p-2.5 text-primary text-sm focus:border-accent transition-colors placeholder:text-faint"
                            placeholder="Email (optional)"
                          />
                        </div>
                      )}

                      <p className="text-xs text-faint">
                        Checked reports become an issue on GitHub. Your email is never published.
                      </p>

                      {/* Error message */}
                      {status === 'error' && serverError && (
                        <div
                          id="report-error"
                          role="alert"
                          className="p-3 bg-danger/10 border-l-4 border-danger text-danger text-xs leading-relaxed"
                        >
                          {serverError}
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={status === 'submitting' || details.trim().length === 0}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent text-inverted text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send size={14} aria-hidden="true" />
                        <span>{status === 'submitting' ? 'Submitting...' : 'Submit Report'}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportPanel;
