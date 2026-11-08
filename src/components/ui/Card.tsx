import React from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  hoverEffect?: boolean;
}

/**
 * Card — surface primitive.
 *
 * | State   | Style                                    |
 * |---------|------------------------------------------|
 * | Default | border-border, no background             |
 * | Hover   | border-accent/40 (if hoverEffect enabled)  |
 *
 * No border-radius. No shadow. No background fill (comes from parent).
 */
const Card: React.FC<CardProps> = ({ children, className = '', href, hoverEffect = true }) => {
  const baseClasses = [
    'border border-border',
    hoverEffect ? 'hover:border-accent/40 transition-colors duration-base' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return (
      <Link to={href} className={`block ${baseClasses}`}>
        {children}
      </Link>
    );
  }

  return <div className={baseClasses}>{children}</div>;
};

export default Card;
