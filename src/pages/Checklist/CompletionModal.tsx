import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  aircraftName: string;
  /** Returns true when progress was reset; false when the user cancelled the confirm. */
  onResetFlight: () => boolean;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  aircraftName,
  onResetFlight,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Trap focus and dismiss on Escape
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button initially
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
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

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-base/75 cursor-default"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Flight Preparation Complete"
            className="
              relative bg-surface border border-border/80 w-full max-w-sm
              p-8 text-center overflow-hidden z-modal text-left
            "
          >
            {/* Success Green Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-success" />

            {/* Close button in corner */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-primary p-1 transition-colors"
              aria-label="Close dialog"
            >
              <X size={16} aria-hidden="true" />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center">
              <CheckCircle2
                size={44}
                className="text-success mb-4 stroke-[2px]"
                aria-hidden="true"
              />

              <h2 className="type-heading text-primary font-semibold text-center mb-1">
                FLIGHT COMPLETE
              </h2>

              <p className="text-2xs text-muted uppercase text-center mb-6">
                {aircraftName} Procedures Verified
              </p>

              <div className="w-full h-px bg-border/60 mb-6" />

              <p className="type-body text-primary text-center leading-relaxed mb-8">
                Procedures complete. Engines off and systems secured. Aircraft is safe and parked.
              </p>

              {/* Actions */}
              <div className="w-full space-y-2">
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="
                    w-full py-3 bg-accent text-inverted font-bold text-xs uppercase
                    hover:bg-accent/90 transition-colors cursor-pointer text-center
                  "
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onResetFlight()) onClose();
                  }}
                  className="
                    w-full py-2.5 border border-border text-muted font-semibold text-xs uppercase
                    hover:text-danger hover:border-danger/40 transition-colors cursor-pointer text-center
                    flex items-center justify-center gap-2
                  "
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  <span>Reset Checklist</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CompletionModal;
