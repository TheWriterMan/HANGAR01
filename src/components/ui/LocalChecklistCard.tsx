import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { countLocalItems, LocalChecklist } from '../../utils/localChecklists';
import { formatPostDate } from '../../utils/posts';

interface LocalChecklistCardProps {
  checklist: LocalChecklist;
  /** h3 when the card sits under a section's h2. */
  headingLevel?: 'h2' | 'h3';
  /** Controls under the card (Delete on /hangar), outside the link. */
  footer?: React.ReactNode;
}

/**
 * A My Hangar checklist: a card like BlogCard's body, with no image, since a
 * local checklist has no banner. All text is the visitor's own, shown as plain text.
 */
const LocalChecklistCard: React.FC<LocalChecklistCardProps> = ({
  checklist,
  headingLevel: Heading = 'h3',
  footer,
}) => {
  const { meta } = checklist;
  const maker = [meta.addon, meta.manufacturer].filter(Boolean);
  const facts = [`${countLocalItems(checklist)} items`, meta.sim].filter(Boolean).join(' · ');

  return (
    <div className="h-full bg-surface border border-border hover:border-accent/40 transition-colors duration-base flex flex-col">
      <Link
        to={`/hangar/${checklist.id}`}
        className="group flex-1 flex flex-col gap-2 p-5 md:p-6 min-w-0"
      >
        {maker.length > 0 && (
          <span className="text-xs font-bold uppercase text-muted truncate">
            {maker.join(' · ')}
          </span>
        )}
        <Heading className="type-subheading font-medium text-primary leading-snug break-words">
          {meta.name}
        </Heading>
        <span className="text-xs text-muted">{facts}</span>
        <span className="mt-auto pt-4 flex items-center justify-between text-xs text-muted group-hover:text-accent transition-colors">
          <span>
            Imported{' '}
            <time dateTime={checklist.createdAt}>{formatPostDate(checklist.createdAt)}</time>
          </span>
          <ArrowUpRight size={12} aria-hidden="true" />
        </span>
      </Link>
      {footer && (
        <div className="flex justify-end border-t border-border/50 px-3 py-1.5">{footer}</div>
      )}
    </div>
  );
};

export default LocalChecklistCard;
