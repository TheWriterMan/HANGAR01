import React from 'react';
import { Aircraft } from '../../types';
import { postsForAircraft, relatedAircraft } from '../../utils/related';
import RelatedSection from '../../components/layout/RelatedSection';
import AircraftCard from '../../components/ui/AircraftCard';
import BlogCard from '../../components/ui/BlogCard';

/** Guides that link to this checklist, then related checklists. */
const ChecklistRelated: React.FC<{ aircraft: Aircraft }> = ({ aircraft }) => {
  const guides = postsForAircraft(aircraft.slug);
  const related = relatedAircraft(aircraft);

  return (
    <>
      {guides.length > 0 && (
        <RelatedSection id="aircraft-guides" eyebrow="Read More" title="Guides for This Aircraft">
          {guides.map((post, i) => (
            <BlogCard key={post._id} post={post} index={i} headingLevel="h3" />
          ))}
        </RelatedSection>
      )}
      {related.length > 0 && (
        <RelatedSection id="related-checklists" eyebrow="Fly Next" title="Related Checklists">
          {related.map((ac, i) => (
            <AircraftCard key={ac.slug} aircraft={ac} index={i} headingLevel="h3" />
          ))}
        </RelatedSection>
      )}
    </>
  );
};

export default ChecklistRelated;
