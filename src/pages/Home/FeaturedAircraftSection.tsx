import React from 'react';
import { AircraftSummary } from '../../types';
import AircraftCard from '../../components/ui/AircraftCard';

/** The home page shows two cards a row from 640 px, each about half the window wide. */
const TWO_COLUMN_SIZES = '(min-width: 640px) 50vw, 100vw';
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {newAircraft.map((ac, i) => (
          <AircraftCard key={ac.slug} aircraft={ac} index={i} sizes={TWO_COLUMN_SIZES} />
        ))}
      </div>

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
