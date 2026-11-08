import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  href?: string;
  to?: string;
  label?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  children?: React.ReactNode;
}

/**
 * Button — 3 variants, each with full state coverage.
 *
 * | Variant  | Default                          | Hover              | Disabled       |
 * |----------|----------------------------------|--------------------|----------------|
 * | primary  | bg-primary text-inverted         | opacity-90         | opacity-40     |
 * | outline  | border-border text-primary       | border-muted       | opacity-40     |
 * | ghost    | text-muted no-border             | text-primary       | opacity-40     |
 *
 * Focus: handled by global :focus-visible rule in index.css
 */
const Button: React.FC<ButtonProps> = ({
  href,
  to,
  label = 'View Details',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'outline',
  children,
}) => {
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-primary text-inverted border-primary hover:opacity-90',
    outline: 'text-primary border-border hover:border-muted',
    ghost: 'text-muted border-border/0 hover:text-primary',
  };

  const baseClassName = [
    'inline-flex items-center justify-center gap-2',
    'px-4 py-2 text-sm font-medium',
    'border transition-colors',
    `duration-base`,
    variants[variant],
    disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {children || label}
      <ArrowRight size={14} aria-hidden="true" className="opacity-60" />
    </>
  );

  if (disabled || onClick || type === 'submit') {
    return (
      <button onClick={onClick} type={type} disabled={disabled} className={baseClassName}>
        {content}
      </button>
    );
  }

  if (to) {
    return (
      <Link to={to} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={baseClassName}>
      {content}
    </a>
  );
};

export default Button;
