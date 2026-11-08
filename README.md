<div align="center">
  <img src="public/app-icon.png" alt="HANGAR01 Logo" width="120" height="120" />

  <h1>HANGAR01</h1>

  <p><strong>Interactive checklists for flight simulation</strong></p>

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_19-20232a?style=flat&logo=react" alt="React"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind"></a>
  </p>
</div>

---

## Overview

HANGAR01 is a website of interactive checklists for Microsoft Flight Simulator add-on aircraft, at [hangar01.space](https://www.hangar01.space). It covers 29 aircraft, from PMDG and FlyByWire airliners to GA, business jets and military types.

- Each checklist has three views: Quick, Normal and Full.
- Ticks are saved in the browser, so a flight can be picked up where it was left.
- Any checklist prints, or saves as a PDF, in the view you have chosen.
- Every checklist has a Report Inaccuracy button for wrong or missing items.
- News posts and tutorials are at /news.
- The same checklists run in X-Plane through [our fork of the AviTab plugin](https://github.com/TheWriterMan/avitab-hangar01) (beta).

There is no CMS or database. Checklists are JSON files and posts are Markdown files, both in this repo.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 with PostCSS
- **Content**: Static JSON + Markdown (committed to repo)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Quick Start

### Prerequisites

- Node.js 24 (see `.nvmrc`) and npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/TheWriterMan/HANGAR01.git
   cd HANGAR01
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

   Application will be available at `http://localhost:5173`

## Development

### Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run typecheck     # Type-check without emitting
npm run lint          # ESLint
npm test              # Unit tests (Vitest)
npm run validate:checklists  # Check every checklist JSON file
npm run test:a11y     # Run headless automated accessibility testing
npm run test:a11y:ui  # Run Playwright UI for interactive visual debugging
```

### Project Structure

```
/
├── api/             # Vercel Serverless Functions
├── content/         # Static content (JSON checklists, blog markdown)
├── public/          # Static assets
├── scripts/         # Prerender, SEO check, checklist validation, aircraft index, IndexNow, news feeds
├── src/
│   ├── components/  # Shared React components
│   ├── pages/       # Route components
│   ├── hooks/       # Custom React hooks
│   ├── services/    # Data fetchers
│   └── utils/       # Helper functions
└── docs/            # Documentation
```

### Content Management

- **Aircraft & Checklists**: Static JSON in `content/checklists/<slug>.json`
- **Blog Posts/NOTAMs**: Markdown files in `content/posts/`
- **Static Assets**: Stored in `public/` directory

## Deployment

Deployed to Vercel by GitHub Actions: `main` is the live site, `dev` deploys a preview at dev.hangar01.space. Domain: [hangar01.space](https://hangar01.space).

## Documentation

Detailed documentation is available in the `docs/` directory:

- [Project Overview](docs/Overview.md) - Architecture and tech stack details
- [Design System](DESIGN.md) - Styling and design tokens
- [Checklist Guide](docs/checklist-guide.md) - How checklists are written and structured
- [Sample checklist (Google Sheet)](https://docs.google.com/spreadsheets/d/1FOwrMW12GnBehLL55yKaKO_LF_Dew_CfiF2zfGhlkb4/copy) - A copy to fill in, for a new checklist without writing JSON
- [Reporting & Contact](docs/Reporting-plan.md) - Contact form, Report Inaccuracy flow and server env vars

## Contributing

Spotted a wrong item or want a new aircraft? See [CONTRIBUTING.md](CONTRIBUTING.md). Checklists are plain JSON in `content/checklists/`, so most fixes are a one-file pull request. To send a whole new checklist without writing JSON, fill in a copy of the [sample Sheet](https://docs.google.com/spreadsheets/d/1FOwrMW12GnBehLL55yKaKO_LF_Dew_CfiF2zfGhlkb4/copy) and attach it to a "New checklist" issue.

To report a security problem, see [SECURITY.md](SECURITY.md).

## License

- **Code:** MIT. See [LICENSE](LICENSE).
- **Content** (checklists in `content/checklists/`, posts in `content/posts/`): CC BY-NC 4.0, so no commercial use without permission. See [content/LICENSE.md](content/LICENSE.md).
- Aircraft images (in `public/images/aircraft/`) and add-on names belong to their owners and aren't covered by either license. Fonts in `public/fonts/` keep their own licenses.

HANGAR01 is for flight simulation only. Never use these checklists for real-world flight.
