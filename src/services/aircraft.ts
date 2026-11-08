import { Aircraft, AircraftSummary } from '../types';
import aircraftIndex from '../../content/aircraft-index.json';

// ─── Aircraft fetchers (static JSON) ────────────────────────────────────────

const NEW_AIRCRAFT_SLUGS = ['c130', 'f35', 'md82', 'fokker-f28'];
const POPULAR_AIRCRAFT_SLUGS = ['b737', 'a320', 'c172', 'b777'];

/** Bundled at build time, so reading it is synchronous and works in the prerender. */
export function getAircraftList(): AircraftSummary[] {
  // Index is pre-sorted in canonical display order (comingSoon asc, model asc
  // via code-unit comparison) by the export script. Return as-is.
  return aircraftIndex as AircraftSummary[];
}

export async function fetchAircraftList(): Promise<AircraftSummary[]> {
  return getAircraftList();
}

export async function fetchAircraftBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Aircraft | null> {
  try {
    const res = await fetch(`/content/checklists/${encodeURIComponent(slug)}.json`, { signal });
    if (!res.ok) return null;
    return (await res.json()) as Aircraft;
  } catch {
    return null;
  }
}

export function getHomePageData(): {
  newAircraft: AircraftSummary[];
  popular: AircraftSummary[];
} {
  const index = aircraftIndex as AircraftSummary[];

  const newAircraft = NEW_AIRCRAFT_SLUGS.map((s) => index.find((ac) => ac.slug === s)).filter(
    (ac): ac is AircraftSummary => ac !== undefined,
  );

  const popular = POPULAR_AIRCRAFT_SLUGS.map((s) => index.find((ac) => ac.slug === s)).filter(
    (ac): ac is AircraftSummary => ac !== undefined,
  );

  return { newAircraft, popular };
}
