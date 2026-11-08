import React from 'react';
import { Link } from 'react-router-dom';
import { Aircraft } from '../../types';
import { formatAircraftName } from '../../utils/aircraft';
import { formatPostDate } from '../../utils/posts';

interface ChecklistAboutProps {
  aircraft: Aircraft;
  fullCount: number;
  normalCount: number;
  quickCount: number;
  /** YYYY-MM-DD of the checklist's last change, when the build knows it. */
  lastUpdated?: string;
}

/** A phase title inside a sentence: "Shutdown & Secure" → "shutdown and secure". */
const inSentence = (title: string) => title.replace(/&/g, 'and').toLowerCase();

/**
 * What the checklist is for, what it covers and how to get it corrected, under the list.
 * Built from the checklist itself, so it stays true when a checklist changes. Searchers and
 * search engines look for this on the pages that rank.
 */
const ChecklistAbout: React.FC<ChecklistAboutProps> = ({
  aircraft,
  fullCount,
  normalCount,
  quickCount,
  lastUpdated,
}) => {
  const name = formatAircraftName(aircraft);
  const isDefault = !aircraft.addon || aircraft.addon === 'Microsoft';
  const phases = aircraft.checklist;
  const first = phases[0];
  const last = phases[phases.length - 1];
  const endsAtShutdown = /shutdown/i.test(last.title);

  const modes =
    normalCount === quickCount
      ? `${fullCount} items in Full mode and ${quickCount} in Quick.`
      : `${fullCount} items in Full mode, ${normalCount} in Normal and ${quickCount} in Quick.`;

  const rows: { term: string; detail: React.ReactNode }[] = [
    {
      term: 'Aircraft',
      detail: (
        <>
          {isDefault
            ? `The ${name} that comes with Microsoft Flight Simulator (MSFS).`
            : `${aircraft.addon}'s ${name} add-on for Microsoft Flight Simulator (MSFS).`}
          {aircraft.variant && ` ${aircraft.variant}`}
        </>
      ),
    },
    {
      term: 'Covers',
      detail:
        phases.length > 1
          ? `${phases.length} phases, from ${inSentence(first.title)} to ${inSentence(last.title)}.${
              endsAtShutdown
                ? ''
                : ` It ends at ${inSentence(last.title)}: shutdown isn't written yet.`
            }`
          : `${inSentence(first.title)}.`,
    },
    { term: 'Modes', detail: modes },
    ...(lastUpdated ? [{ term: 'Updated', detail: formatPostDate(lastUpdated, 'long') }] : []),
    {
      term: 'Corrections',
      detail: (
        <>
          If a step is wrong, missing or out of order, use Report Inaccuracy at the top of the page.
          Reports go straight to the maker, and fixes are listed in the{' '}
          <Link
            to="/changelog"
            className="underline underline-offset-2 hover:text-primary transition-colors"
          >
            changelog
          </Link>
          .
        </>
      ),
    },
    { term: 'Use', detail: 'For flight simulation only. Never use it for real-world flying.' },
  ];

  return (
    <section aria-labelledby="about-checklist" className="mt-12 md:mt-16">
      <h2 id="about-checklist" className="type-subheading text-primary pb-3 border-b border-border">
        About this checklist
      </h2>
      <dl className="mt-5 grid grid-cols-1 sm:grid-cols-[8rem_minmax(0,1fr)] gap-x-6 gap-y-1 sm:gap-y-4 max-w-3xl">
        {rows.map(({ term, detail }) => (
          <React.Fragment key={term}>
            <dt className="text-xs font-medium uppercase text-faint pt-3 sm:pt-0.5">{term}</dt>
            <dd className="type-body text-muted">{detail}</dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
};

export default ChecklistAbout;
