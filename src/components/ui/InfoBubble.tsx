import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { DURATION_FAST } from '../../utils/motion';
import { useHydrated } from '../../hooks/useHydrated';

interface InfoBubbleProps {
  info: string;
}

/**
 * Inline info trigger positioned next to the label.
 *
 * Desktop: hover OR focus reveals a tooltip-style text box above the icon.
 * Mobile: tap opens a small floating popup anchored above the icon.
 * Tap anywhere outside, Escape key, or the X dismisses.
 * Keyboard accessible: shows on focus, hides on blur/Escape.
 */
const InfoBubble: React.FC<InfoBubbleProps> = ({ info }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popupWidth = 280;
    let left = rect.left + rect.width / 2 - popupWidth / 2;

    if (left < 12) left = 12;
    if (left + popupWidth > window.innerWidth - 12) {
      left = window.innerWidth - 12 - popupWidth;
    }

    setPopupStyle({
      position: 'fixed',
      bottom: window.innerHeight - rect.top + 8,
      left,
      width: popupWidth,
    });
  }, []);

  // Desktop hover with delay
  const hoverTimeout = useRef<number | null>(null);

  const handleMouseEnter = () => {
    hoverTimeout.current = window.setTimeout(() => {
      setIsHovered(true);
      updatePosition();
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      window.clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setIsHovered(false);
  };

  // Keyboard focus (a mouse click focuses too, but that's handled as a tap)
  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (!e.currentTarget.matches(':focus-visible')) return;
    setIsFocused(true);
    updatePosition();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Tap, click, Enter or Space: pins the popup open, or closes it if it's showing from focus
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isOpen || isFocused) {
      setIsOpen(false);
      setIsFocused(false);
      return;
    }
    updatePosition();
    setIsOpen(true);
  };

  // Keep Enter/Space on the trigger from reaching a surrounding row (Escape still bubbles)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
  };

  // Escape key to dismiss
  useEffect(() => {
    const visible = isOpen || isHovered || isFocused;
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsHovered(false);
        setIsFocused(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isHovered, isFocused]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popupRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [isOpen]);

  // Close on scroll
  useEffect(() => {
    if (!isOpen && !isHovered && !isFocused) return;
    const handler = () => {
      setIsOpen(false);
      setIsHovered(false);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [isOpen, isHovered, isFocused]);

  const showPopup = isOpen || isHovered || isFocused;
  // document.body only exists in the browser; the portal mounts after hydration.
  const hydrated = useHydrated();

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="More info"
        aria-expanded={showPopup}
        aria-describedby={showPopup ? tooltipId : undefined}
        className="
                    shrink-0 inline-flex items-center justify-center
                    w-6 h-6 ml-1.5
                    text-muted hover:text-accent
                    transition-colors duration-fast
                    rounded-full cursor-help
                "
      >
        <Info size={14} strokeWidth={2.5} aria-hidden="true" />
      </button>
      {/* The note stays in the page text, folded as before, so search engines and tools that
          don't run scripts can read it. The popup below is what people see. */}
      <span hidden>{info}</span>

      {hydrated &&
        createPortal(
          <AnimatePresence>
            {showPopup && (
              <motion.div
                ref={popupRef}
                id={tooltipId}
                role="tooltip"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: DURATION_FAST }}
                style={popupStyle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                className="
                                z-tooltip
                                bg-surface-raised border border-border
                                px-3.5 py-3
                                text-xs leading-relaxed text-primary
                                font-sans
                            "
              >
                {info.split('\n').map((line, i, arr) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < arr.length - 1 && (
                      <>
                        <br />
                        <br />
                      </>
                    )}
                  </React.Fragment>
                ))}
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-1.5
                                    w-3 h-3 rotate-45
                                    bg-surface-raised border-r border-b border-border"
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export default InfoBubble;
