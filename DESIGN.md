---
version: alpha
name: HANGAR01
description: Interactive flight-sim checklists. Architectural minimalism, zero-radius, high-contrast dark-first UI.
colors:
  base: '#111111'
  surface: '#191919'
  surface-raised: '#222222'
  border: '#2d2d2d'
  primary: '#ebebeb'
  muted: '#999999'
  faint: '#878787'
  inverted: '#111111'
  accent: '#7b9eb8'
  warning: '#e2a336'
  danger: '#d45555'
  success: '#3d9970'
typography:
  display:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: 600
    lineHeight: 1.1
  title:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: 600
    lineHeight: 1.2
  heading:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 500
    lineHeight: 1.3
  subheading:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.7
  caption:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: IBM Plex Mono
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.5
spacing:
  page-padding: 1rem
  page-padding-md: 2rem
  header-height: 3rem
  sidebar-width: 14rem
  sidebar-width-lg: 16rem
  max-width-page: 100rem
  max-width-content: 56rem
rounded:
  none: 0px
  full: 9999px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.inverted}'
    padding: 12px
    rounded: '{rounded.none}'
  button-outline:
    backgroundColor: transparent
    textColor: '{colors.primary}'
    rounded: '{rounded.none}'
  button-outline-hover:
    borderColor: '{colors.muted}'
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.muted}'
    rounded: '{rounded.none}'
  card:
    backgroundColor: transparent
    textColor: '{colors.primary}'
    rounded: '{rounded.none}'
---

## Overview

HANGAR01 is a flight-sim checklist platform. The visual identity is **architectural minimalism** — zero-radius geometry, high-contrast dark surfaces, restrained color, and typographic discipline. The UI should feel like an instrument panel: precise, functional, no decoration for decoration's sake.

### Guiding Principle

> Reduce the number of options, then name the ones we choose.

Every token, class, and pattern exists because it was explicitly chosen. If something isn't named here, it doesn't belong in the codebase. Don't invent new values — use what's defined or ask.

### Why This File Exists

Without a single persistent reference, every change drifted — grabbing whatever values looked right at the time. This file is the contract that prevents that drift. It combines machine-readable tokens (YAML above) with design rationale (prose below), so you know both WHAT to use and WHY.

### Source of Truth Hierarchy

1. **This file (`DESIGN.md`)** — the canonical spec.
2. **`src/index.css`** (`@theme {}` block) — implements the tokens as CSS custom properties.

Both must stay in sync. If they conflict, this file wins.

---

## Colors

The palette is rooted in high-contrast neutrals against a deep base. Color is used sparingly — only for meaning (status) or brand identity (accent).

### Architecture: Primitive → Semantic

Two layers exist:

- **Primitives** (raw hex values) — defined in `@theme {}` under `--color-gray-*` and `--color-{blue,amber,red,green}-400`. Components **must never reference primitives directly**. They exist so the semantic layer can point at them, and light mode can remap without touching components.
- **Semantic tokens** — the ONLY colors components may use. Named by role, not by hue.

### Semantic Tokens (Dark — default)

| Token            | Hex     | Role                                                                 |
| ---------------- | ------- | -------------------------------------------------------------------- |
| `base`           | #111111 | Page background                                                      |
| `surface`        | #191919 | Cards, panels, inputs                                                |
| `surface-raised` | #222222 | Hover states, elevated elements                                      |
| `border`         | #2d2d2d | All borders (use opacity modifiers `/50`, `/30` for weaker dividers) |
| `primary`        | #ebebeb | Headings, body text, all readable content                            |
| `muted`          | #999999 | Secondary: dates, metadata, descriptions                             |
| `faint`          | #878787 | Tertiary: timestamps, disabled, placeholders                         |
| `inverted`       | #111111 | Text on filled accent backgrounds                                    |
| `accent`         | #7b9eb8 | Brand accent, CTAs, active states                                    |
| `warning`        | #e2a336 | Caution states                                                       |
| `danger`         | #d45555 | Error, critical                                                      |
| `success`        | #3d9970 | Confirmed, complete                                                  |

### Light Mode Remap

When `[data-theme="light"]` is set on `<html>`, semantic tokens remap:

| Token            | Light value |
| ---------------- | ----------- |
| `base`           | #ffffff     |
| `surface`        | #f5f5f5     |
| `surface-raised` | #ebebeb     |
| `border`         | #d4d4d4     |
| `primary`        | #111111     |
| `muted`          | #525252     |
| `faint`          | #6b6b6b     |
| `inverted`       | #ffffff     |
| `accent`         | #3a6b8a     |
| `warning`        | #8a6218     |
| `danger`         | #b93c3c     |
| `success`        | #2d7a57     |

Components don't change — only the token values swap. This is why components must use semantic tokens exclusively.

### Primitive Palette (reference only)

Grays: `gray-0` (#ffffff), `gray-50` (#f5f5f5), `gray-100` (#ebebeb), `gray-400` (#999999), `gray-600` (#5c5c5c), `gray-800` (#2d2d2d), `gray-900` (#222222), `gray-925` (#191919), `gray-950` (#111111). The scale has intentional gaps (no 200/300/500/700).

Accents: `blue-400` (#7b9eb8), `amber-400` (#e2a336), `red-400` (#d45555), `green-400` (#3d9970).

---

## Typography

Two typefaces. One for everything human-readable, one for machine data.

| Font          | Token       | Use                                                 |
| ------------- | ----------- | --------------------------------------------------- |
| Inter         | `font-sans` | All UI: headings, body, buttons, nav, labels, dates |
| IBM Plex Mono | `font-mono` | Checklist action values, callsigns, codes, counters |

**Rule:** `font-mono` is for DATA VALUES only — things a pilot would read off an instrument (callsigns like `N738WN`, actions like `SET`, codes like `FL380`). Never use mono for headings, navigation, buttons, UI labels, dates, or manufacturer names.

### Named Type Classes

Seven classes defined in `src/index.css` `@layer utilities`. Use these instead of raw Tailwind size/weight combos for body and structural text:

| Class              | Role                        | Size                                      |
| ------------------ | --------------------------- | ----------------------------------------- |
| `.type-display`    | Page title — one per page   | clamp(2.25rem, 4vw, 3rem) / 600 / 1.1     |
| `.type-title`      | Section headings            | clamp(1.875rem, 3vw, 2.25rem) / 600 / 1.2 |
| `.type-heading`    | Sub-sections, group titles  | clamp(1.25rem, 2vw, 1.5rem) / 500 / 1.3   |
| `.type-subheading` | Card titles, form labels    | 1rem / 500 / 1.5                          |
| `.type-body`       | All body/paragraph text     | 0.875rem / 400 / 1.7                      |
| `.type-caption`    | Metadata, dates, secondary  | 0.75rem / 400 / 1.5 (color: muted)        |
| `.type-mono`       | Checklist values, callsigns | 0.75rem / mono / 400 / 1.5                |

**When to use named classes vs raw `text-sm`:** Use named classes for semantic text roles (paragraphs, headings, captions). Use raw `text-sm` / `text-xs` for UI sizing contexts where the named class's line-height or weight would conflict (form inputs, button text, interactive elements with `font-medium`).

### Text Scale

| Token       | Size            |
| ----------- | --------------- |
| `text-2xs`  | 0.625rem (10px) |
| `text-xs`   | 0.75rem (12px)  |
| `text-sm`   | 0.875rem (14px) |
| `text-base` | 1rem (16px)     |
| `text-lg`   | 1.125rem (18px) |
| `text-xl`   | 1.25rem (20px)  |
| `text-2xl`  | 1.5rem (24px)   |
| `text-3xl`  | 1.875rem (30px) |
| `text-4xl`  | 2.25rem (36px)  |
| `text-5xl`  | 3rem (48px)     |
| `text-6xl`  | 3.75rem (60px)  |
| `text-7xl`  | 4.5rem (72px)   |

No arbitrary sizes (`text-[11px]`, `text-[9px]`). If a size isn't in this scale, don't use it.

---

## Layout

### Containers

Two named container utilities. Every page uses one of these:

| Utility              | Max-width       | Use                                                      |
| -------------------- | --------------- | -------------------------------------------------------- |
| `.container-page`    | 100rem (1600px) | Listings, grids, multi-column layouts                    |
| `.container-content` | 56rem (896px)   | Long-form: blog posts, changelogs, single-column reading |

Both apply `margin-inline: auto` + responsive padding (`1rem` → `2rem` at md).

### Breakpoints

Only three breakpoints are used in practice. Do not add more.

| Name | Width  | Typical use                             |
| ---- | ------ | --------------------------------------- |
| `sm` | 640px  | Stack → side-by-side for small elements |
| `md` | 768px  | Mobile → desktop layout shift           |
| `lg` | 1024px | Sidebar expansion, wider grids          |

`xl` (1280px) and `2xl` (1536px) are defined by Tailwind but unused. Don't introduce them.

### Layout Tokens

| Token                 | Value           | Role                              |
| --------------------- | --------------- | --------------------------------- |
| `--height-header`     | 3rem (48px)     | Fixed header height               |
| `--height-shell`      | measured        | Header plus banner; sticky offset |
| `--width-sidebar`     | 14rem (224px)   | Checklist sidebar (default)       |
| `--width-sidebar-lg`  | 16rem (256px)   | Checklist sidebar (lg breakpoint) |
| `--max-width-page`    | 100rem (1600px) | .container-page                   |
| `--max-width-content` | 56rem (896px)   | .container-content                |
| `--padding-page`      | 1rem (16px)     | Horizontal padding (mobile)       |
| `--padding-page-md`   | 2rem (32px)     | Horizontal padding (desktop)      |

### Checklist Page Layout

Sidebar (14rem, sticky at z-sticky) beside a header row and the phases. Sidebar collapses on mobile into horizontal sticky tabs below the header. The header (breadcrumbs, aircraft name, facts, mode toggle) renders once for both layouts; `.layout-checklist` in `index.css` places it, so the page keeps one `<h1>`.

### Procedure Post Layout

A post with `:::checklist` blocks is a procedure: its `##` headings become numbered steps on a timeline, and its ticks add up across every checklist. From lg a sticky step rail with progress sits left of the reading column (`.layout-procedure`); below lg a sticky strip shows the current step and progress. Code: `src/pages/BlogPost/ProcedurePost.tsx`.

---

## Elevation & Depth

Depth is conveyed through **borders and tonal layers**, not shadows. The dark base creates natural depth — lighter surfaces "rise" above it.

### Z-Index Scale

Named tokens. Raw numeric z-index values (`z-50`, `z-40`) are forbidden.

| Token         | Value | Use                          |
| ------------- | ----- | ---------------------------- |
| `--z-skip`    | 100   | Skip-to-content link         |
| `--z-modal`   | 70    | Modals (CompletionModal)     |
| `--z-tooltip` | 60    | InfoBubble / tooltips        |
| `--z-overlay` | 50    | Panel backdrops, mobile menu |
| `--z-header`  | 40    | Top navigation bar           |
| `--z-sticky`  | 30    | Sidebar, sticky sub-headers  |
| `--z-base`    | 0     | Default stacking context     |
| `--z-behind`  | -10   | Hidden elements (honeypots)  |

### Shadow Policy

No `shadow-*` utilities on any element. Depth is achieved through border + surface color differentiation. Exception: none currently used.

---

## Shapes

The shape language is **zero-radius everywhere**. No `rounded-*` on cards, panels, inputs, or buttons. This creates the rigid, engineered instrument-panel aesthetic.

| Token           | Value  | Use                                      |
| --------------- | ------ | ---------------------------------------- |
| `rounded: none` | 0px    | Everything by default                    |
| `rounded: full` | 9999px | Avatars, logos, circular indicators only |

**Forbidden:** `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `blur-*`.

---

## Components

### Motion

Three duration tokens for all CSS transitions. Framer Motion animations use the equivalent JS constants from `src/utils/motion.ts`.

| Token                | Value                        | Use                            |
| -------------------- | ---------------------------- | ------------------------------ |
| `--duration-instant` | 100ms                        | Checkbox tick, active press    |
| `--duration-fast`    | 150ms                        | Hover color/border changes     |
| `--duration-base`    | 200ms                        | All other transitions          |
| `--ease-default`     | cubic-bezier(0.4, 0, 0.2, 1) | Standard easing for everything |

Framer Motion constants (`src/utils/motion.ts`): `DURATION_INSTANT` (0.1), `DURATION_FAST` (0.15), `DURATION_BASE` (0.2), `EASE_DEFAULT` ([0.4, 0, 0.2, 1]).

### Buttons

Three variants in `src/components/ui/Button.tsx`:

- **primary** — `bg-primary text-inverted border-primary` → `hover:opacity-90`
- **outline** — `border-border text-primary` → `hover:border-muted`
- **ghost** — text only, no border, `text-muted` → `hover:text-primary`

### Cards

`AircraftCard` and `BlogCard` (`src/components/ui/`): `border-border`, hover `border-accent/40`; BlogCard fills `bg-surface`.

### Hover Patterns

Two named text-hover intents:

| Pattern       | Class                | Use                                                             |
| ------------- | -------------------- | --------------------------------------------------------------- |
| **Brighten**  | `hover:text-primary` | Muted/faint text becomes readable (nav links, footer, metadata) |
| **Highlight** | `hover:text-accent`  | Signals interactivity (accordion titles, card CTAs, icons)      |

`hover:text-white` is forbidden. Use `hover:text-primary` instead.

### Interaction: .prose-link

Body/article links: underline with `border-color` decoration. Hover brightens decoration to `text-primary`.

### Focus

One global rule: `outline: 2px solid accent; outline-offset: 2px` on `:focus-visible`.

---

## Do's and Don'ts

### Do

- Use semantic color tokens exclusively in components
- Use named type classes for paragraphs, headings, captions
- Use `container-page` or `container-content` for page layout
- Use named z-index tokens (`z-header`, `z-overlay`, etc.)
- Use duration tokens (`duration-base`, `duration-fast`, `duration-instant`)
- Use `font-mono` only on data values (callsigns, codes, actions, counters)
- Keep all transitions under 200ms (`duration-base` max)
- Use `hover:text-primary` for brighten, `hover:text-accent` for highlight

### Don't

- Don't use `text-white`, `bg-white`, `text-black`, `bg-black`
- Don't use raw palette colors (`red-500`, `gray-200`, `slate-*`, `amber-500`)
- Don't use `rounded-*` on cards, panels, inputs, or buttons
- Don't use `shadow-*` on any element
- Don't use `blur-*` anywhere
- Don't use `animate-pulse` for decoration
- Don't use `bg-transparent` / `border-transparent` (omit the property instead)
- Don't use arbitrary values (`text-[11px]`, `w-[320px]`) — use a token or the scale
- Don't use `tracking-*` / letter-spacing — defaults everywhere
- Don't use raw duration values (`duration-200`, `duration-300`)
- Don't use raw z-index values (`z-50`, `z-40`)
- Don't use `font-mono` on headings, nav, buttons, labels, dates, or manufacturer names
- Don't invent new breakpoints beyond sm/md/lg
- Don't claim "full coverage" without exact counts — verify everything

### Implementation Notes

- **Tailwind version:** v4. Config lives in `@theme {}` block of `src/index.css`. There is no `tailwind.config.js`.
- **Token namespacing:** TW4 auto-generates utilities for `--color-*`, `--text-*`, etc. But `--z-*` and `--duration-*` are generic CSS vars that require explicit utility definitions in `@layer utilities`.
- **Light mode:** Handled via `[data-theme="light"]` CSS selector swapping semantic token values. Components never need conditional dark/light logic.
- **Framer Motion:** Cannot consume CSS custom properties. Import from `src/utils/motion.ts`. Spring animations (e.g., ReportPanel slide-in) are an accepted exception with no token equivalent.
