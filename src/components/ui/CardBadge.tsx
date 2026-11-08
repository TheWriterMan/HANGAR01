import React from 'react';

export type CardBadgeVariant = 'update' | 'news' | 'tutorial' | 'training' | 'new';

interface CardBadgeProps {
  variant: CardBadgeVariant;
  className?: string;
}

/**
 * CardBadge — solid, opaque status label used on cards (blog, aircraft, etc).
 *
 * Filled variants put `text-inverted` on a semantic fill (like the primary
 * button), which keeps 4.5:1 contrast in both themes.
 */
const variantStyles: Record<CardBadgeVariant, string> = {
  update: 'bg-accent text-inverted border-accent',
  news: 'bg-success text-inverted border-success',
  tutorial: 'bg-warning text-inverted border-warning',
  training: 'bg-surface-raised text-primary border-border',
  new: 'bg-accent text-inverted border-accent',
};

const variantLabels: Record<CardBadgeVariant, string> = {
  update: 'UPDATE',
  news: 'NEWS',
  tutorial: 'TUTORIAL',
  training: 'TRAINING',
  new: 'NEW',
};

const CardBadge: React.FC<CardBadgeProps> = ({ variant, className = '' }) => {
  return (
    <span
      className={`text-2xs font-medium uppercase px-3 py-1.5 border ${variantStyles[variant]} ${className}`}
    >
      {variantLabels[variant]}
    </span>
  );
};

export default CardBadge;
