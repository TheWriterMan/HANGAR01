import React from 'react';
import { Aircraft } from '../../types';
import { ChecklistMode } from '../../components/ui/ModeToggle';
import ModeToggle from '../../components/ui/ModeToggle';
import Breadcrumbs, { Crumb } from '../../components/layout/Breadcrumbs';
import { AlertTriangle } from 'lucide-react';
import { MODE_DESCRIPTIONS } from '../../utils/checklist';
import { formatPostDate } from '../../utils/posts';

interface AircraftHeaderProps {
  aircraft: Aircraft;
  /** Breadcrumbs and the Report button. Left out in the home hero's screen. */
  crumbs?: Crumb[];
  /** YYYY-MM-DD of the checklist's last change, when the build knows it. */
  lastUpdated?: string;
  mode: ChecklistMode;
  onModeChange: (m: ChecklistMode) => void;
  showModeToggle: boolean;
  fullCount: number;
  normalCount: number;
  quickCount: number;
  onReportOpen?: () => void;
  reportTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  /** The name's tag. `p` where the header is shown inside another page (the home hero's screen). */
  titleAs?: 'h1' | 'p';
  /** False in the home hero: no mode description under the toggle. */
  showModeDescription?: boolean;
}

/**
 * Breadcrumbs, the aircraft name (the page's one <h1>), description, facts
 * and mode toggle. Shared by the mobile and desktop layouts.
 */
const AircraftHeader: React.FC<AircraftHeaderProps> = ({
  aircraft,
  crumbs,
  lastUpdated,
  mode,
  onModeChange,
  showModeToggle,
  fullCount,
  normalCount,
  quickCount,
  onReportOpen,
  reportTriggerRef,
  titleAs: Title = 'h1',
  showModeDescription = true,
}) => {
  // Default aircraft (Microsoft) aren't searched by developer, so they get none.
  const addon = aircraft.addon && aircraft.addon !== 'Microsoft' ? aircraft.addon : '';
  return (
    <div className="md:mb-10">
      {/* Breadcrumbs + Report button on one line. A bar on mobile. */}
      {crumbs && (
        <div className="print:hidden! flex items-center justify-between gap-4 px-4 py-5 border-b border-border md:px-0 md:pt-0 md:pb-6 md:border-b-0">
          <Breadcrumbs crumbs={crumbs} />
          <button
            ref={reportTriggerRef}
            onClick={onReportOpen}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs md:text-sm text-warning hover:text-warning/80 transition-colors"
          >
            <AlertTriangle size={14} aria-hidden="true" />
            <span>Report Inaccuracy</span>
          </button>
        </div>
      )}

      <div className="px-4 pt-5 pb-6 md:p-0">
        {Title === 'h1' ? (
          // The heading names the add-on: "PMDG · Boeing 737NG". The COMBINED label sits beside it,
          // not in it. The updated date takes the line under the name.
          <>
            <div className="flex items-center gap-3">
              <h1>
                <span className="block text-xs font-bold uppercase text-muted mb-1 md:mb-2">
                  {addon && (
                    <>
                      {addon}
                      <span aria-hidden="true"> · </span>
                      <span className="sr-only"> </span>
                    </>
                  )}
                  {aircraft.manufacturer}
                </span>{' '}
                <span className="block type-display text-primary">
                  {aircraft.model}
                  {aircraft.suffix && aircraft.suffix !== 'Combined' && aircraft.suffix}
                </span>
              </h1>
              {aircraft.suffix === 'Combined' && (
                <span className="mt-2 type-caption font-medium px-2 py-0.5 border border-accent text-accent text-2xs">
                  COMBINED
                </span>
              )}
            </div>
            {lastUpdated && (
              <p className="mt-1.5 text-sm font-medium text-muted">
                Updated {formatPostDate(lastUpdated, 'long')}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase text-muted mb-1 md:mb-2">
              {aircraft.manufacturer}
            </p>
            <div className="type-display text-primary">
              <Title className="inline">
                {aircraft.model}
                {aircraft.suffix && aircraft.suffix !== 'Combined' && (
                  <span>{aircraft.suffix}</span>
                )}
              </Title>
              {aircraft.suffix === 'Combined' && (
                <sup className="ml-2 type-caption font-medium px-2 py-0.5 border border-accent text-accent align-super text-2xs">
                  COMBINED
                </sup>
              )}
            </div>
          </>
        )}
        {aircraft.description && (
          <p className="mt-3 text-sm md:text-(length:--text-base) text-muted leading-relaxed max-w-2xl">
            {aircraft.description}
          </p>
        )}
        {/* Only the date: the add-on, systems and size stay off this line. On the
            checklist page the date sits under the name instead. */}
        {lastUpdated && Title !== 'h1' && (
          <p className="mt-3 type-caption">Updated {formatPostDate(lastUpdated, 'long')}</p>
        )}

        {/* Mode Toggle */}
        {showModeToggle && (
          <div className="mt-6 print:hidden!">
            <div className="max-w-sm">
              <ModeToggle
                mode={mode}
                onChange={onModeChange}
                fullCount={fullCount}
                normalCount={normalCount}
                quickCount={quickCount}
              />
            </div>
            {/* One line on desktop: no max width. */}
            {showModeDescription && (
              <p className="mt-2.5 text-xs text-muted leading-relaxed">
                {
                  MODE_DESCRIPTIONS[
                    normalCount === quickCount && mode === 'normal' ? 'quick' : mode
                  ]
                }
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AircraftHeader;
