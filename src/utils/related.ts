/**
 * Internal links between checklists and posts. Posts and the aircraft index
 * are bundled at build time, so these run the same in the prerender and the
 * browser.
 */
import { AircraftSummary, BlogPost } from '../types';
import { getAircraftList } from '../services/aircraft';
import { getAllPosts } from './posts';

const RELATED_LIMIT = 3;

/** Slugs of every checklist a post links to, in order of first mention. */
export function aircraftSlugsInPost(post: BlogPost): string[] {
  const slugs = [...post.content.matchAll(/\/aircraft\/([a-z0-9-]+)/g)].map((m) => m[1]);
  return [...new Set(slugs)];
}

/** Checklists a post covers: the ones it links to. */
export function aircraftInPost(post: BlogPost): AircraftSummary[] {
  const index = getAircraftList();
  return aircraftSlugsInPost(post)
    .map((slug) => index.find((ac) => ac.slug === slug))
    .filter((ac): ac is AircraftSummary => ac !== undefined);
}

/** Other checklists: same add-on first, then the same kind of aircraft. */
export function relatedAircraft(aircraft: {
  slug: string;
  addon?: string;
  systemsType: string;
}): AircraftSummary[] {
  const others = getAircraftList().filter(
    (ac) => ac.slug !== aircraft.slug && ac.status !== 'draft',
  );
  const sameAddon = others.filter((ac) => aircraft.addon && ac.addon === aircraft.addon);
  const sameType = others.filter(
    (ac) => ac.systemsType === aircraft.systemsType && !sameAddon.includes(ac),
  );
  return [...sameAddon, ...sameType].slice(0, RELATED_LIMIT);
}

/** Posts that link to a checklist, newest first. */
export function postsForAircraft(slug: string): BlogPost[] {
  return getAllPosts(150).filter((post) => aircraftSlugsInPost(post).includes(slug));
}

/** Other posts: ones covering the same aircraft first, then the same category. */
export function relatedPosts(post: BlogPost): BlogPost[] {
  const slugs = aircraftSlugsInPost(post);
  const others = getAllPosts(150).filter((p) => p.slug.current !== post.slug.current);
  const sameAircraft = others.filter((p) => aircraftSlugsInPost(p).some((s) => slugs.includes(s)));
  const sameCategory = others.filter(
    (p) => p.category === post.category && !sameAircraft.includes(p),
  );
  return [...sameAircraft, ...sameCategory].slice(0, RELATED_LIMIT);
}
