import React from 'react';

interface TextSectionProps {
  title: string;
  children: React.ReactNode;
}

/** One headed block of plain text on the About and Privacy pages. */
const TextSection: React.FC<TextSectionProps> = ({ title, children }) => (
  <section className="mt-10 first:mt-0">
    <h2 className="type-subheading text-primary mb-3">{title}</h2>
    <div className="space-y-3 type-body text-muted max-w-2xl [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary">
      {children}
    </div>
  </section>
);

export default TextSection;
