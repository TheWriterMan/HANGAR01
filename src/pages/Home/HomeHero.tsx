import React from 'react';
import AircraftSearch from '../../components/ui/AircraftSearch';
import ChecklistTOC from '../Checklist/ChecklistTOC';
import AircraftHeader from '../Checklist/AircraftHeader';
import PhaseGroup from '../Checklist/PhaseGroup';
import ChecklistProgressBar from '../Checklist/ChecklistProgressBar';
import { useChecklistState } from '../../hooks/useChecklistState';
import { formatAircraftName } from '../../utils/aircraft';
import type { Aircraft, ChecklistPhase } from '../../types';
import c172Json from '../../../content/checklists/c172.json';

/*
 * The home hero: a working checklist in a "page window", with the Cessna photo behind the words.
 *
 * The words and search sit on the 172's photo, which fills the hero's first block: on phones one
 * screen tall, words centred, and nothing else; from md a little less than the screen, so the
 * top of the checklist screen shows below it. That screen (md and up) is the 172's checklist
 * page, working: the checklist page's own components and state hook, so phases, modes, items,
 * and "Return to Hangar" do what they do on /aircraft/c172 (breadcrumbs, Report, facts and the
 * mode line left out).
 * Two differences, so it stays a hero: progress and mode live in this component only
 * (persist: false), never touching the 172 page's saved progress; and one phase shows at a time,
 * cut after its first section (or the first few, to show at least four items) (phaseNav: 'switch').
 */

const c172 = c172Json as unknown as Aircraft;
const aircraftName = formatAircraftName(c172);
/**
 * The photo: "Sunrise in a 172" by Don Ramey Logan,
 * CC BY 4.0 (https://commons.wikimedia.org/wiki/File:Sunrise_in_a_172_by_Don_Ramey_Logan.jpg),
 * 3648x1624, credited in the footer on this page. The wing and strut from the cabin against the
 * dawn, so nothing in it needs hiding: it covers the block. Phones show the strut and the wing's
 * lit underside (x 35%); from md, the middle. The horizon (y 57%) stays in the frame at every
 * width.
 */
const HERO_PHOTO = '/images/hero/sunrise-172';
const HERO_SRCSET = [1280, 1920, 2560, 3648].map((w) => `${HERO_PHOTO}-${w}.webp ${w}w`).join(', ');
/** Covering a 3648:1624 photo: as wide as the block, or 2.246x its height, whichever is more. */
const HERO_SIZES = 'max(100vw, calc((100svh - 5rem) * 2.246))';

/** Black over the photo, darker behind the words (4.5:1 or more for every line) and lighter
 *  away from them, so the aircraft reads. Phones: a soft band across the words (an ellipse there
 *  draws a dome on the sky). From md: an ellipse fitted to a box round the words (closest-side,
 *  so it never meets the box's edge). */
const DIM = 'rgba(0,0,0,0.22)';
const BAND =
  'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0) 100%)';
const ELLIPSE =
  'radial-gradient(closest-side, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.46) 60%, rgba(0,0,0,0.34) 72%, rgba(0,0,0,0.2) 84%, rgba(0,0,0,0.08) 93%, rgba(0,0,0,0) 100%)';

/** The sections the screen shows: the first, then more until at least four items show. */
function firstSections(phase: ChecklistPhase) {
  const groups: ChecklistPhase['groups'] = [];
  let items = 0;
  for (const group of phase.groups) {
    if (groups.length > 0 && items >= 4) break;
    groups.push(group);
    items += group.items.length;
  }
  return groups;
}

const HomeHero: React.FC = () => {
  const checklist = useChecklistState(c172, { persist: false, phaseNav: 'switch' });

  const active =
    checklist.checklistData.find((p) => p.id === checklist.activePhaseId) ??
    checklist.checklistData[0];
  // The phase's first section, and the next ones while fewer than four items show (Quick's
  // Preflight has 1, 1 and 2, so all three show, as on the 172 page). Its item objects are the
  // hook's own, so keys and counts hold.
  const shown: ChecklistPhase | undefined = active && { ...active, groups: firstSections(active) };

  return (
    <section className="w-full">
      {/* The photo block. The photo is dark in both themes, so the words take the dark tokens
          (on-photo). Phones: one screen tall below the header (svh, so the browser's bars don't
          cut it), words centred. From md: the screen less 6rem, so the checklist screen's top
          shows; its lower 4rem sits under the screen's top edge. No overflow clip, so the
          search's results can open below it. */}
      <div className="relative on-photo bg-base flex flex-col justify-center min-h-[calc(100svh-var(--height-shell,5rem))] md:min-h-[calc(100svh-var(--height-shell,5rem)-6rem)] py-12 md:pb-28">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={`${HERO_PHOTO}-1920.webp`}
            srcSet={HERO_SRCSET}
            sizes={HERO_SIZES}
            alt=""
            width={3648}
            height={1624}
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-[35%_57%] md:object-[50%_57%]"
          />
        </div>
        <div aria-hidden="true" className="absolute inset-0" style={{ background: DIM }} />
        <div className="relative z-sticky container-page text-center">
          <div
            aria-hidden="true"
            className="md:hidden absolute inset-x-0 -inset-y-32 -z-10"
            style={{ background: BAND }}
          />
          <div
            aria-hidden="true"
            className="hidden md:block absolute inset-x-0 -inset-y-40 mx-auto max-w-6xl -z-10"
            style={{ background: ELLIPSE }}
          />
          {/* The heading says what the site is in plain words above the wordmark.
              The version sits beside the heading, not in it. */}
          <div className="font-semibold leading-none text-primary text-5xl md:text-6xl lg:text-7xl mb-5">
            <h1 className="inline">
              <span className="block text-primary text-sm font-normal leading-normal mb-3">
                Interactive checklists for MSFS
              </span>{' '}
              HANGAR<span className="text-accent">_01</span>
            </h1>
            <span className="text-muted text-2xs font-normal ml-1 align-top">v1.1.1</span>
          </div>
          <p className="text-muted text-sm md:text-(length:--text-base) md:leading-relaxed max-w-md mb-6 mx-auto">
            Learn flows, procedures, and master your favorite airframes with interactive checklists.
          </p>
          <div className="w-full max-w-lg mx-auto text-left">
            <AircraftSearch />
          </div>
        </div>
      </div>

      {/* The screen: the checklist page's progress bar and grid (ChecklistView) on its own
          background and border. Sticky parts sit still. The whole hero is
          no taller than about 150vh on desktop, so the screen is cut at 50svh + 14rem (the photo
          block is 100svh less the header and 6rem, and the screen starts 4rem up into it) and
          fades into the page's background instead of ending in a button. */}
      <div className="hidden md:block relative container-page -mt-16">
        <section
          aria-label={`${aircraftName} checklist`}
          className="bg-base border border-border max-h-[calc(50svh+14rem)] overflow-hidden [&_.sticky]:static [&_.sticky]:h-auto"
        >
          <ChecklistProgressBar progress={checklist.progress} />
          <div className="layout-checklist">
            <div className="md:col-start-2 md:row-start-1 md:px-10 md:pt-10">
              <div className="max-w-6xl mx-auto">
                {/* Name, description and modes only: no breadcrumbs, Report button, facts or
                    mode description. */}
                <AircraftHeader
                  aircraft={c172}
                  mode={checklist.mode}
                  onModeChange={checklist.setMode}
                  showModeToggle={checklist.showModeToggle}
                  fullCount={checklist.fullCount}
                  normalCount={checklist.normalCount}
                  quickCount={checklist.quickCount}
                  titleAs="p"
                  showModeDescription={false}
                />
              </div>
            </div>

            <ChecklistTOC
              phases={checklist.checklistData}
              activePhaseId={active?.id ?? ''}
              onSelectPhase={checklist.handlePhaseSelect}
              landmark={false}
            />

            <div className="md:col-start-2 md:row-start-2 p-4 md:px-10 md:pt-0 md:pb-10">
              <div className="max-w-6xl mx-auto">
                {shown && (
                  <PhaseGroup
                    phase={shown}
                    completedItems={checklist.completedItems}
                    toggleItem={checklist.handleToggleItem}
                    checkAllInPhase={checklist.handleCheckAllInPhase}
                    getItemKey={checklist.getItemKey}
                    wholePhase={active}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
        {/* The fade: from clear to the page's background over the screen's last 12rem, border
            included, so the screen ends softly where the hero ends. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-base"
        />
      </div>
    </section>
  );
};

export default HomeHero;
