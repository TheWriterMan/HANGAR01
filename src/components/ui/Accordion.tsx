import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DURATION_BASE } from '../../utils/motion';

interface AccordionProps {
  title: string | React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  id: string;
  className?: string;
}

const Accordion: React.FC<AccordionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
  id,
  className = '',
}) => {
  const btnId = `${id}-btn`;
  const panelId = `${id}-panel`;

  return (
    <div className={`border-b border-border last:border-b-0 ${className}`}>
      <button
        id={btnId}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-sm text-primary group-hover:text-accent transition-colors pr-4">
          {title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: DURATION_BASE }}
          className="shrink-0"
        >
          <ChevronDown size={14} className="text-muted" aria-hidden="true" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION_BASE }}
            className="overflow-hidden"
          >
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className="pb-4 type-body text-muted"
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Closed, the answer stays in the page text, folded, for search engines and tools that
          don't run scripts. */}
      {!isOpen && <div hidden>{children}</div>}
    </div>
  );
};

export default Accordion;
