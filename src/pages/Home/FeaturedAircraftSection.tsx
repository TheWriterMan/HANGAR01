import React from 'react';
import { AircraftSummary } from '../../types';
import AircraftCard from '../../components/ui/AircraftCard';

/** The home page shows two cards a row from 640 px, each about half the window wide. */
const TWO_COLUMN_SIZES = '(min-width: 640px) 50vw, 100vw';
/** New Arrivals: four across from 1280 px, a slider below it (cards about 80% wide on a phone, 45% on a tablet, 31% at 1024). */
const NEW_ARRIVALS_SIZES =
  '(min-width: 1280px) 25vw, (min-width: 1024px) 31vw, (min-width: 640px) 45vw, 80vw';
import Button from '../../components/ui/Button';

interface FeaturedAircraftSectionProps {
  newAircraft: AircraftSummary[];
  popular: AircraftSummary[];
}

const FeaturedAircraftSection: React.FC<FeaturedAircraftSectionProps> = ({
  newAircraft,
  popular,
}) => {
  return (
    <>
      {/* ── New Arrivals ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-2xs font-bold uppercase text-accent mb-1">Just Added</p>
          <h2 className="type-title text-primary">New Arrivals</h2>
        </div>
      </div>

      {/* One row of four on desktop. Below 1280 px it is a slider that runs to the
          screen's edges, with the next card peeking in to show there is more. */}
      <ul
        aria-label="New arrivals"
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-(--padding-page) px-(--padding-page) scroll-px-(--padding-page) md:-mx-(--padding-page-md) md:px-(--padding-page-md) md:scroll-px-(--padding-page-md) pb-2 mb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:grid xl:grid-cols-4 xl:gap-4 xl:mx-0 xl:px-0 xl:pb-0 xl:overflow-visible"
      >
        {newAircraft.map((ac, i) => (
          <li
            key={ac.slug}
            className="shrink-0 basis-[80%] sm:basis-[45%] lg:basis-[31%] snap-start xl:basis-auto"
          >
            <AircraftCard aircraft={ac} index={i} sizes={NEW_ARRIVALS_SIZES} compact />
          </li>
        ))}
      </ul>

      <div className="flex justify-center mb-16">
        <Button to="/aircraft" label="View All" variant="outline" />
      </div>

      <div className="border-t border-border mb-16" />

      {/* ── Popular ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-2xs font-bold uppercase text-accent mb-1">Most Flown</p>
          <h2 className="type-title text-primary">Popular</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {popular.map((ac, i) => (
          <AircraftCard key={ac.slug} aircraft={ac} index={i} sizes={TWO_COLUMN_SIZES} />
        ))}
      </div>

      <div className="flex justify-center mb-16">
        <Button to="/aircraft" label="View All" variant="outline" />
      </div>

      <div className="border-t border-border mb-16" />
    </>
  );
};

export default FeaturedAircraftSection;
