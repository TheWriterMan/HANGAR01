import { Mail, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FC, RefObject } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../ui/Logo';
import ThemeToggle from '../../ui/ThemeToggle';
import MobileNavigationCategory from './MobileNavigationCategory';
import { navigationCategories } from './menuData';

interface MobileNavigationDialogProps {
  open: boolean;
  onDismiss: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const MobileNavigationDialog: FC<MobileNavigationDialogProps> = ({
  open,
  onDismiss,
  triggerRef,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>('aircraft');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      trigger?.focus();
    };
  }, [open, triggerRef]);

  return (
    <dialog
      id="mobile-navigation-dialog"
      ref={dialogRef}
      aria-modal="true"
      aria-label="Navigation menu"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      className="m-0 h-dvh max-h-dvh w-full max-w-none bg-base p-0 text-primary backdrop:bg-base/80 md:hidden"
    >
      <div className="flex h-full flex-col animate-menu-in">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
          <Link to="/" aria-label="HANGAR01 — home" className="flex items-center gap-2.5">
            <Logo className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-primary">
              HANGAR<span className="text-accent">_01</span>
            </span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onDismiss}
            aria-label="Close menu"
            className="p-2 text-muted transition-colors duration-fast hover:text-primary"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Mobile primary navigation" className="min-h-0 flex-1 overflow-y-auto">
          {navigationCategories.map((category) => (
            <MobileNavigationCategory
              key={category.id}
              category={category}
              expanded={expandedId === category.id}
              onToggle={() =>
                setExpandedId((current) => (current === category.id ? null : category.id))
              }
            />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3 border-t border-border bg-base p-4">
          <Link
            to="/contact"
            className="flex flex-1 items-center justify-center gap-2 bg-accent py-3 text-sm font-medium uppercase text-inverted transition-colors duration-fast hover:bg-accent/90"
          >
            <Mail size={14} aria-hidden="true" />
            Contact
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </dialog>
  );
};

export default MobileNavigationDialog;
