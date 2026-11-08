import React from 'react';
import { ChangelogEntry as ChangelogEntryType, sectionColor } from '../../utils/changelog';
import { formatPostDate } from '../../utils/posts';

interface ChangelogEntryProps {
  entry: ChangelogEntryType;
  index: number;
}

const ChangelogEntry: React.FC<ChangelogEntryProps> = ({ entry, index }) => {
  return (
    <article className="animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="mb-4 border-b border-border pb-3">
        <h2 className="type-subheading text-primary">{entry.heading}</h2>
        {entry.date && (
          <p className="mt-1 type-caption">
            <time dateTime={entry.date}>{formatPostDate(entry.date, 'long')}</time>
          </p>
        )}
      </div>

      <div className="space-y-4">
        {entry.sections.map((section) => (
          <div key={section.title} className="sm:flex sm:items-baseline sm:gap-4">
            {/* Phones: the label above its list, so the list gets the full width and a right
                inset. From sm, the label column beside it. */}
            <span
              className={`block mb-2 sm:mb-0 text-xs font-medium uppercase sm:w-16 shrink-0 ${sectionColor(section.title)}`}
            >
              {section.title}
            </span>
            <ul className="space-y-1.5 flex-1 pr-4 sm:pr-0">
              {section.items.map((item, i) => (
                <li key={i} className="type-body text-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
};

export default ChangelogEntry;
