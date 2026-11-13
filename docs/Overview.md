# Project Overview

**HANGAR01** is a React website of interactive checklists for flight simulation. It serves aircraft checklists, posts and metadata from static JSON and Markdown committed to this repo. Hosted on Vercel at [hangar01.space](https://hangar01.space).

## Architecture & Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with PostCSS
- **Content**: Static JSON (`content/` directory) + Markdown blog posts (`content/posts/`)
- **Routing**: React Router v7
- **Deployment**: Vercel (main branch auto-deploys)
- **Icons**: Lucide React
- **Animations**: Framer Motion

## File Structure

```
/
├── api/                 # Vercel Serverless Functions (server-side only)
│   ├── _lib/            # Shared helpers (not deployed as functions)
│   ├── contact.ts       # Contact form handler → Discord webhook
│   └── report.ts        # Report Inaccuracy → GitHub issue, Groq spam check, email to hi@hangar01.space
├── content/             # Static content (JSON checklists, blog markdown)
│   ├── aircraft-index.json  # generated before dev/build/typecheck, gitignored
│   ├── checklists/      # Per-aircraft detail JSON files
│   └── posts/           # Markdown blog posts with YAML frontmatter
├── public/              # Static assets
├── scripts/             # Build and content scripts (.mjs): prerender, SEO check, checklist validation, aircraft index
├── src/
│   ├── components/      # Shared React components (2+ page consumers)
│   │   ├── layout/      # App shell (header, footer, page header, breadcrumbs, navigation)
│   │   ├── ui/          # Design-system primitives (buttons, cards, checklist item, search)
│   │   └── seo/         # <SEO>: head tags and JSON-LD
│   ├── pages/           # One folder per route, with co-located single-use components.
│   │                    # Routes are listed in the ROUTES table in App.tsx
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Data fetchers (static JSON)
│   ├── utils/           # Pure functions, constants, formatters
│   ├── App.tsx          # Router & layout
│   ├── index.css        # Global styles & Tailwind entry
│   ├── entry-client.tsx # Browser entry: hydrates prerendered pages
│   ├── entry-server.tsx # Prerender entry: renders a route to HTML
│   └── types.ts         # TypeScript interfaces
├── vercel.json          # Vercel routing config
└── index.html           # HTML entry point
```

## Design

Tokens, type, layout and rules: [DESIGN.md](../DESIGN.md).

## Data Flow

### Content Pipeline

1. Aircraft checklists live as static JSON in `content/checklists/<slug>.json`
2. `content/aircraft-index.json` is generated from the checklist files by `scripts/generate-aircraft-index.mjs` (predev/prebuild); never edit it
3. Blog posts are Markdown files in `content/posts/` with YAML frontmatter
4. The index and posts are bundled at build time; a checklist's JSON is fetched from `/content/checklists/<slug>.json` at runtime, and every route is prerendered

### Form Submissions (Contact + Reports)

1. User submits form in browser
2. POST hits Vercel Serverless Function (`/api/contact` or `/api/report`)
3. Contact sends a Discord embed; a report opens a GitHub issue that a Groq model checks, and is emailed to the inbox (full flow: [Reporting-plan.md](Reporting-plan.md))
4. Secrets stay server-side

### Checklist State Management

- **Mode**: Per-aircraft toggle — `quick`, `normal`, `full`. Persisted to `localStorage` (`HANGAR01_mode_<slug>`).
- **Completion**: Item ticks persisted to `localStorage` under stable ids (`<phaseId>/<itemId>`), so editing a checklist can only drop a tick, never move it. Survives mode switches. Key format, the legacy positional format and its migration are documented in `src/utils/progress.ts`.
- All storage access goes through `src/utils/storage.ts`, which never throws.
- **Filter pipeline**: `filterChecklist()` drops items not visible in the current mode, then drops empty groups, then drops phases with fewer than 4 items (My Hangar checklists keep small phases).

### My Hangar (`/hangar`)

- Visitors import their own checklist from a CSV; it stays in their browser. `src/utils/checklistCsv.ts` converts rows to the same `ChecklistPhase` tree (Papa Parse, loaded with `import()` on the import screen only), and `src/utils/localChecklists.ts` keeps it in IndexedDB (`hangar01` / `local-checklists`), falling back to memory without IndexedDB.
- `/hangar/:id` renders the local checklist with `ChecklistView`'s `local` variant: noindex, no Report, About or related sections, no checklist events (page views send `/hangar/local`). Ticks use the v2 progress key with the local id as the slug.
- Both routes are prerendered noindex and kept out of the sitemap. `/hangar/:id` has no file per id, so `vercel.json` (and the preview server, in `vite.config.ts`) rewrite it to the prerendered loading shell `/hangar/local`.

### Usage counts

- Read the usage counts before changing a checklist page: the seven events sent by `src/utils/events.ts` are stored as site `hangar01` in the `events` D1 database in the HOBI Cloudflare account, and the private `TheWriterMan/events` repo's README says how to query them.

## Development

```bash
# Frontend
npm run dev          # Vite dev server (port 5173)
npm run build        # Production build, prerenders every route to static HTML

# Validate static content
node scripts/validate-checklists.mjs
```

## Environment Variables

Server-side only, set in Vercel: see [Reporting-plan.md](Reporting-plan.md#security).

## Deployment

- `.github/workflows/ci.yml`: after the quality checks, a push to `main` deploys production (www.hangar01.space) and pings IndexNow; a push to `dev` deploys the preview at dev.hangar01.space.
- The Vercel project `hangar01` has no Git link: `ci.yml` deploys through the Vercel API with `gitSource`.
- Speed Insights needs Vercel Pro (its toggle answers `payment_required`), so it is off.
- `vite preview` answers an unknown path with the home page and 200, while Vercel serves `404.html`. Check 404s on dev, not on the preview.
- A browser check that should count as a real visitor uses Playwright with `channel: 'chrome'`, `ignoreDefaultArgs: ['--enable-automation']` and `--disable-blink-features=AutomationControlled`.
