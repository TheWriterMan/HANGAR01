/**
 * Aircraft image paths.
 *
 * Every aircraft has three files in `public/images/aircraft/`, keyed by slug, so
 * no path is stored in the checklist JSON:
 *   `{slug}.webp`      the full image, up to 1280 px wide
 *   `{slug}-640.webp`  640 px wide, for cards on small screens and the menu
 *   `og/{slug}.jpg`    1200×630 crop for Open Graph and Twitter cards
 */
const AIRCRAFT_DIR = '/images/aircraft';

/** The aircraft image: 640 px wide for `small`, otherwise the full one. */
export function aircraftImageUrl(slug: string, size: 'small' | 'full' = 'full'): string {
  return size === 'small' ? `${AIRCRAFT_DIR}/${slug}-640.webp` : `${AIRCRAFT_DIR}/${slug}.webp`;
}

/** `srcset` for the aircraft image. */
export function aircraftImageSrcSet(slug: string): string {
  return `${aircraftImageUrl(slug, 'small')} 640w, ${aircraftImageUrl(slug)} 1280w`;
}

/** 1200×630 JPEG for Open Graph and Twitter cards. */
export function aircraftOgImageUrl(slug: string): string {
  return `${AIRCRAFT_DIR}/og/${slug}.jpg`;
}

/**
 * A post cover at card size. Covers are 2400 px WebP banners; cards show them about 485 px
 * wide, so each `.webp` cover has a 1000 px copy beside it, `<name>-1000.webp`
 * (tests/unit/posts.test.ts checks it exists). Other covers are already small.
 */
export function postCardImageUrl(imageUrl: string): string {
  return imageUrl.endsWith('.webp') ? imageUrl.replace(/\.webp$/, '-1000.webp') : imageUrl;
}
