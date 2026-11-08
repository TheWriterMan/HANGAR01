# Changelog

<!-- RULES (not rendered on site)
- Updated once per merge to main, not per commit.
- Dev commits can be messy — summarise at merge time.
- PR description and changelog entry are the same thing.
- Only include things users would notice or care about,
  unless it's a major backend overhaul.

VERSIONING
- vX.Y.Z    features, new content, meaningful changes
- hotfix-YYYY-MM-DD   small fixes, copy tweaks, data corrections
- v2.0.0    major redesign/overhaul

ENTRY FORMAT
## [label] — [title, optional] — Month DD, YYYY (the day it reached main)
### Added / Fixed / Changed / Removed / Data
- Description
-->

---

## v1.1.1 — About, Privacy & Printable Checklists — November 8, 2026

### Added

- Print or save any checklist as a PDF, in the mode you have chosen
- "About this checklist" under every checklist: the add-on and version it covers, its phases, item counts per mode and how to report a mistake
- About and Privacy pages

### Changed

- Checklist headings name the add-on, and the updated date sits under the aircraft name
- Checklist settings use the regular font
- Each release in the changelog shows its date
- Posts open with their summary instead of repeating their first paragraph

### Fixed

- The 787 checklist is for the 787-10 that comes with MSFS
- King Air 350i and DA62: Normal mode is hidden, because it showed the same items as Quick
- Sharper, lighter images on news cards

---

## v1.1.0 — Military Checklists & New Navigation — November 4, 2026

### Added

- Lockheed Martin C-130J Super Hercules by Blackbird Simulations
- Lockheed Martin F-35A Lightning II by IndiaFoxtEcho
- McDonnell Douglas MD-82 by Leonardo
- Fokker F28 Fellowship by Just Flight
- Cessna Citation X by FlightFX
- de Havilland Canada DHC-6-300 Twin Otter by Aerosoft
- Britten-Norman Islander BN-2 by BlackBox Simulations
- Piper Comanche 250 by A2A Simulations
- Beechcraft Bonanza G36 by Microsoft
- Military category on the Aircraft page
- Related checklists and guides at the end of each checklist and post
- Breadcrumbs on checklist and news pages
- Each checklist shows the date it was last updated

### Changed

- New home page: a sunrise photo from a Cessna 172 behind the title, with the 172's checklist working below it on tablets and desktops
- New navigation menu with aircraft categories
- Pages load faster and show their content before scripts finish loading
- Checklist progress survives checklist updates
- Plainer loading and search text

### Fixed

- Theme no longer flashes dark before switching to light mode
- Keyboard and screen reader access to checklist items and info bubbles
- Announcement bar text is readable again
- The progress bar stays in view while you scroll a checklist

---

## v1.0.3 — Let There Be Light — June 20, 2026

### Added

- Cirrus SF50 Vision Jet G2 by FlightFX
- Cessna 310R by Milviz
- Cessna 414AW by Milviz
- Light Mode (experimental)
- New checklist completion UI
- Labels for add-on vendor
- Search bar in the mobile menu

### Fixed

- Checklist improvements for all aircraft
- Specified add-on vendor
- Replaced incorrect images for TBM 930, 208 Grand Caravan, and A310

## hotfix-2026-06-05 — June 5, 2026

### Fixed

- Changed slug /aircrafts to /aircraft (with redirects)
- Increase font size of checklist item on mobile
- Minor typos

---

## v1.0.2 — ATR-42/72 & Backend Improvements — June 4, 2026

### Added

- ATR 42/72-600
- Category filter on the Aircraft page
- Aircraft now sorted by popularity
- "NEW" badges on recently added aircraft

### Changed

- "Phases" and "PhaseGroups" now dim on completion
- News section redesigned (previously called NOTAMs)
- All aircraft banner images replaced
- Replaced Sanity CMS with a static JSON flat-file system

### Fixed

- Sluggish Framer Motion replaced with pure CSS
- Various mobile overflow and contrast issues

---

## v1.0.1 — A380, Accessibility, & AviTab — May 30, 2026

### Added

- Airbus A380-800
- AviTab plugin for X-Plane

### Fixed

- Various accessibility improvements

## hotfix-2026-05-25 — May 25, 2026

### Fixed

- Checklist item labels truncating with ellipsis on narrow/portrait displays

### Added

- Changelog page (footer link)
