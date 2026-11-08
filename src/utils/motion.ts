/**
 * Framer Motion transition presets — mirrors the CSS design tokens.
 *
 * Why this exists:
 * Framer Motion (JS) can't consume CSS custom properties directly.
 * This file provides the same duration/easing values as the design system
 * tokens defined in src/index.css, so JS animations stay in sync.
 *
 * If the CSS tokens change, update these values to match.
 */

/** Duration tokens (seconds — Framer Motion uses seconds, CSS uses ms) */
export const DURATION_INSTANT = 0.1; // --duration-instant: 100ms
export const DURATION_FAST = 0.15; // --duration-fast: 150ms
export const DURATION_BASE = 0.2; // --duration-base: 200ms

/** Standard easing — matches --ease-default: cubic-bezier(0.4, 0, 0.2, 1) */
export const EASE_DEFAULT = [0.4, 0, 0.2, 1] as const;

/** Common transition presets for consistent usage */
export const transition = {
  instant: { duration: DURATION_INSTANT, ease: EASE_DEFAULT },
  fast: { duration: DURATION_FAST, ease: EASE_DEFAULT },
  base: { duration: DURATION_BASE, ease: EASE_DEFAULT },
} as const;
