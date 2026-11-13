/**
 * AircraftCard — Cinematic Banner
 *
 * Square image on mobile, 4:3 on sm+. Full colour photo always.
 * Two-layer scrim keeps text readable at all times:
 *   1. Left-to-right accent (steel blue) tint — identity without obscuring the aircraft.
 *   2. Bottom-up black gradient — text zone is always dark enough.
 * Sim badge top-right. Addon shown inline with manufacturer bottom-left.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { AircraftSummary } from '../../types';
import { aircraftImageSrcSet, aircraftImageUrl } from '../../utils/images';
import { formatModelName } from '../../utils/aircraft';
import CardBadge from './CardBadge';

interface AircraftCardProps {
  aircraft: AircraftSummary;
  index: number;
  /** h3 when the card sits under a section's h2. */
  headingLevel?: 'h2' | 'h3';
  /** The image's `sizes`. The default fits the three-column library grid. */
  sizes?: string;
  /** Smaller type and padding, for the home page's four-across New Arrivals row. */
  compact?: boolean;
}

const simLabel = (sim: string): string => {
  const s = sim.toLowerCase();
  if (s.includes('x-plane') || s.includes('xplane')) return 'X-Plane';
  if (s.includes('msfs') || s.includes('flight simulator')) return 'MSFS';
  return sim;
};

const AircraftCard: React.FC<AircraftCardProps> = ({
  aircraft,
  headingLevel: Heading = 'h2',
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  compact = false,
}) => {
  return (
    <Link
      to={`/aircraft/${aircraft.slug}`}
      className="group block border border-border hover:border-accent/40 transition-colors duration-base overflow-hidden"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-surface">
        <img
          src={aircraftImageUrl(aircraft.slug)}
          srcSet={aircraftImageSrcSet(aircraft.slug)}
          sizes={sizes}
          width={960}
          height={640}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-base group-hover:scale-[1.02]"
        />

        {/* Layer 1 — left-to-right accent tint */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(123,158,184,0.65) 0%, rgba(123,158,184,0.25) 45%, rgba(123,158,184,0) 75%)',
          }}
          aria-hidden="true"
        />

        {/* Layer 2 — bottom-up black scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.50) 35%, rgba(0,0,0,0) 65%)',
          }}
          aria-hidden="true"
        />

        {/* Sim badge — top right */}
        {aircraft.flightsim && (
          <div className="absolute top-3 right-3">
            <span className="inline-block bg-success text-inverted text-2xs font-bold uppercase px-2.5 py-1 md:px-3 md:py-1.5">
              {simLabel(aircraft.flightsim)}
            </span>
          </div>
        )}

        {/* NEW badge — top left */}
        {aircraft.isNew && (
          <div className="absolute top-3 left-3">
            <CardBadge variant="new" />
          </div>
        )}

        {/* Text — bottom left, over the scrim */}
        <div className={`absolute bottom-0 left-0 right-0 ${compact ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold uppercase text-white/80">
              {aircraft.manufacturer}
            </span>
            {aircraft.addon && (
              <>
                <span className="text-white/30 text-2xs" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-medium uppercase text-white/60 border border-white/20 px-1.5 py-px">
                  {aircraft.addon}
                </span>
              </>
            )}
          </div>

          <div
            className={`${compact ? 'text-base' : 'text-base md:text-lg'} font-medium text-white leading-tight`}
          >
            <Heading className="inline">{formatModelName(aircraft)}</Heading>
            {aircraft.suffix === 'Combined' && (
              <sup className="text-accent text-2xs ml-1 font-medium">ALL</sup>
            )}
          </div>

          <p className="text-xs text-white/55 line-clamp-1 mt-1 group-hover:text-white/80 transition-colors duration-base">
            {aircraft.description}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default AircraftCard;
