import React from 'react';

interface RelatedSectionProps {
  /** Used for the heading id. */
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}

/** A titled grid of cards linking to related pages (checklists, posts). */
const RelatedSection: React.FC<RelatedSectionProps> = ({ id, eyebrow, title, children }) => {
  return (
    <section aria-labelledby={`${id}-heading`} className="pt-12 pb-4">
      <div className="mb-6">
        <p className="text-2xs font-bold uppercase text-accent mb-1">{eyebrow}</p>
        <h2 id={`${id}-heading`} className="type-title text-primary">
          {title}
        </h2>
      </div>
      {/* Columns follow the width the section has, not the screen: as many 18rem-or-wider
          columns as fit, so two cards fill a post's 56rem reading column and a wide checklist
          page gets three. Empty columns are kept (auto-fill), so a lone card keeps its column
          width instead of stretching across a wide row. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-6">
        {children}
      </div>
    </section>
  );
};

export default RelatedSection;
