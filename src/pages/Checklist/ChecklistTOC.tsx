import React, { useRef, useEffect } from 'react';
import { ChecklistPhase } from '../../types';
import BackButton from '../../components/ui/BackButton';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ChecklistTOCProps {
  phases: ChecklistPhase[];
  activePhaseId: string;
  onSelectPhase: (id: string) => void;
  isDemo?: boolean;
  /** False where the TOC sits inside another landmark (the home hero's checklist section), so its sidebar is not a
   *  nested complementary landmark (axe landmark-complementary-is-top-level). */
  landmark?: boolean;
  /** The back button. A My Hangar checklist goes back to /hangar. */
  back?: { to: string; label: string };
}

/**
 * Phase navigation: sticky tabs on mobile, a sticky sidebar from md. The
 * aircraft header lives in AircraftHeader, shared by both layouts.
 */
const ChecklistTOC: React.FC<ChecklistTOCProps> = ({
  phases,
  activePhaseId,
  onSelectPhase,
  isDemo = false,
  landmark = true,
  back = { to: '/aircraft', label: 'Return to Hangar' },
}) => {
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auto-scroll active tab into view (horizontal scroll within tabs only)
  useEffect(() => {
    if (!tabsScrollRef.current) return;
    const activeEl = tabsScrollRef.current.querySelector(
      '[data-active="true"]',
    ) as HTMLElement | null;
    if (activeEl) {
      const container = tabsScrollRef.current;
      const scrollLeft = activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  }, [activePhaseId, prefersReducedMotion]);

  return (
    <>
      {/* Phase Tabs — sticky against page scroll, below AircraftHeader.
                Outer is sticky and w-full; inner div handles horizontal scroll. */}
      <div className="print:hidden! md:hidden w-full sticky top-12 z-sticky bg-base border-t border-b border-border">
        <div
          ref={tabsScrollRef}
          className="overflow-x-auto"
          role={isDemo ? undefined : 'tablist'}
          aria-label={isDemo ? undefined : 'Checklist phases'}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex px-2">
            {phases.map((phase) => {
              const pid = phase.id;
              return (
                <button
                  key={pid}
                  role={isDemo ? undefined : 'tab'}
                  aria-selected={isDemo ? undefined : activePhaseId === pid}
                  data-active={activePhaseId === pid}
                  onClick={() => onSelectPhase(pid)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={`
                                    shrink-0 px-4 py-4 text-xs font-medium
                                    transition-colors duration-fast whitespace-nowrap
                                    border-b-2
                                    ${
                                      activePhaseId === pid
                                        ? 'text-accent border-b-accent'
                                        : 'text-muted hover:text-primary border-b-transparent'
                                    }
                                `}
                >
                  {phase.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ DESKTOP SIDEBAR — back button + phase navigation ═══ */}
      {isDemo ? (
        <div className="hidden md:flex md:flex-col w-56 lg:w-64 bg-base border-r border-border flex-shrink-0 h-[calc(100vh-3rem)] sticky top-12 overflow-y-auto z-sticky">
          {/* Back button — original styling */}
          <div className="px-4 py-4 border-b border-border">
            <BackButton to={back.to} label={back.label} />
          </div>

          {/* Phase list */}
          <div className="flex flex-col py-3">
            {phases.map((phase) => {
              const pid = phase.id;
              return (
                <button
                  key={pid}
                  onClick={() => onSelectPhase(pid)}
                  className={`
                                    text-left px-5 py-3
                                    text-sm font-medium
                                    transition-colors duration-fast border-l-2
                                    ${
                                      activePhaseId === pid
                                        ? 'border-l-accent text-primary bg-surface/50'
                                        : 'border-l-transparent text-muted hover:text-primary hover:bg-surface/30'
                                    }
                                `}
                >
                  {phase.title}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <aside
          role={landmark ? undefined : 'none'}
          className="print:hidden! hidden md:flex md:flex-col md:col-start-1 md:row-start-1 md:row-span-2 md:self-start w-56 lg:w-64 bg-base border-r border-border flex-shrink-0 h-[calc(100vh-3rem)] sticky top-12 overflow-y-auto z-sticky"
        >
          {/* Back button — original styling */}
          <div className="px-4 py-4 border-b border-border">
            <BackButton to={back.to} label={back.label} />
          </div>

          {/* Phase list */}
          <nav className="flex flex-col py-3" aria-label="Checklist phases">
            {phases.map((phase) => {
              const pid = phase.id;
              return (
                <button
                  key={pid}
                  onClick={() => onSelectPhase(pid)}
                  aria-current={activePhaseId === pid ? 'true' : undefined}
                  className={`
                                    text-left px-5 py-3
                                    text-sm font-medium
                                    transition-colors duration-fast border-l-2
                                    ${
                                      activePhaseId === pid
                                        ? 'border-l-accent text-primary bg-surface/50'
                                        : 'border-l-transparent text-muted hover:text-primary hover:bg-surface/30'
                                    }
                                `}
                >
                  {phase.title}
                </button>
              );
            })}
          </nav>
        </aside>
      )}
    </>
  );
};

export default ChecklistTOC;
