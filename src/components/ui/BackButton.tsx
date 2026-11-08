import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  to: string;
  label: string;
  className?: string;
}

/**
 * BackButton — navigation affordance.
 *
 * | State   | Style                                      |
 * |---------|--------------------------------------------|
 * | Default | border-border bg-surface text-primary      |
 * | Hover   | bg-accent text-inverted border-accent          |
 */
const BackButton: React.FC<BackButtonProps> = ({ to, label, className = '' }) => {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 px-4 py-2 border border-border bg-surface text-primary hover:bg-accent hover:text-inverted hover:border-accent text-sm font-medium transition-colors duration-base group ${className}`}
    >
      <ChevronLeft
        size={14}
        aria-hidden="true"
        className="group-hover:-translate-x-0.5 transition-transform"
      />
      {label}
    </Link>
  );
};

export default BackButton;
