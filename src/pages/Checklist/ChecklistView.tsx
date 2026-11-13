import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Printer, RotateCcw } from 'lucide-react';
import { Aircraft, ChecklistPhase } from '../../types';
import { useChecklistState } from '../../hooks/useChecklistState';
import { useChecklistEvents } from '../../hooks/useChecklistEvents';
import { ChecklistMode } from '../../components/ui/ModeToggle';
import {
  checklistMetaDescription,
  checklistPageTitle,
  formatAircraftName,
  formatModelName,
} from '../../utils/aircraft';
import { aircraftOgImageUrl } from '../../utils/images';
import { getAircraftList } from '../../services/aircraft';
import SEO from '../../components/seo/SEO';
import { breadcrumbSchema, Crumb } from '../../components/layout/Breadcrumbs';
import ChecklistRelated from './ChecklistRelated';
import ChecklistAbout from './ChecklistAbout';
import ChecklistProgressBar from './ChecklistProgressBar';
import AircraftHeader from './AircraftHeader';
import ChecklistTOC from './ChecklistTOC';
import PhaseGroup, { FoldedPhase } from './PhaseGroup';
import ReportPanel from './LazyReportPanel';
import CompletionModal from './CompletionModal';

interface ChecklistViewProps {
  aircraft: Aircraft;
  /**
   * A My Hangar checklist, imported by the visitor and kept in this browser. Its slug is the
   * local id. It lives at /hangar/:id, is noindex, sends no usage events, and has no Report
   * button, About section or related checklists.
   */
  local?: boolean;
}

/** The interactive checklist for one loaded aircraft. Keyed by slug in ChecklistPage. */
const ChecklistView: React.FC<ChecklistViewProps> = ({ aircraft, local = false }) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const reportTriggerRef = useRef<HTMLButtonElement>(null);

  const checklist = useChecklistState(aircraft, {
    onComplete: () => setShowCompletionModal(true),
    local,
  });

  const events = useChecklistEvents({
    slug: aircraft.slug,
    loaded: checklist.loaded,
    mode: checklist.mode,
    checklistData: checklist.checklistData,
    completedItems: checklist.completedItems,
    getItemKey: checklist.getItemKey,
    enabled: !local,
  });
  const handleModeChange = (next: ChecklistMode) => {
    events.viewSwitched(next);
    checklist.setMode(next);
  };

  const aircraftName = formatAircraftName(aircraft);
  const path = local ? `/hangar/${aircraft.slug}` : `/aircraft/${aircraft.slug}`;
  const crumbs: Crumb[] = [
    { label: 'Home', to: '/' },
    local ? { label: 'My Hangar', to: '/hangar' } : { label: 'Aircraft', to: '/aircraft' },
    { label: formatModelName(aircraft), to: path },
  ];
  // The bundled index carries the build-time git date; the checklist JSON doesn't.
  const lastUpdated = local
    ? undefined
    : getAircraftList().find((ac) => ac.slug === aircraft.slug)?.lastUpdated;
  const handleReportOpen = () => {
    if (!reportOpen) events.reportOpened();
    setReportOpen(true);
  };
  // Stable identities: both dialogs re-run their focus effects when onClose changes.
  const handleReportClose = useCallback(() => setReportOpen(false), []);
  const handleModalClose = useCallback(() => setShowCompletionModal(false), []);
  const shownPhases = useMemo(
    () => new Map(checklist.checklistData.map((phase) => [phase.id, phase])),
    [checklist.checklistData],
  );
  const handleReset = () => {
    checklist.handleResetFlight();
  };

  return (
    <>
      <ChecklistProgressBar progress={checklist.progress} />
      <div className="layout-checklist min-h-screen bg-base">
        {local ? (
          <SEO
            title={`${aircraftName} · My Hangar`}
            description="A checklist imported into My Hangar, saved in this browser."
            path={path}
            noindex
          />
        ) : (
          <SEO
            title={checklistPageTitle(aircraft)}
            description={checklistMetaDescription(aircraft)}
            path={path}
            image={aircraftOgImageUrl(aircraft.slug)}
            jsonLd={[breadcrumbSchema(crumbs)]}
            noindex={aircraft.status === 'draft'}
          />
        )}

        {/* Row 1 beside the sidebar from md; first on mobile. */}
        <div className="md:col-start-2 md:row-start-1 md:px-10 md:pt-8">
          <div className="max-w-6xl mx-auto">
            <AircraftHeader
              aircraft={aircraft}
              crumbs={crumbs}
              lastUpdated={lastUpdated}
              mode={checklist.mode}
              onModeChange={handleModeChange}
              showModeToggle={checklist.showModeToggle}
              fullCount={checklist.fullCount}
              normalCount={checklist.normalCount}
              quickCount={checklist.quickCount}
              onReportOpen={local ? undefined : handleReportOpen}
              reportTriggerRef={reportTriggerRef}
              local={local}
            />
          </div>
        </div>

        <ChecklistTOC
          phases={checklist.checklistData}
          activePhaseId={checklist.activePhaseId}
          onSelectPhase={checklist.handlePhaseSelect}
          back={local ? { to: '/hangar', label: 'Return to My Hangar' } : undefined}
        />

        <div className="md:col-start-2 md:row-start-2 flex-1 p-4 md:px-10 md:pt-0 md:pb-24 w-full">
          <div className="max-w-6xl mx-auto">
            {/* Every phase and item of Full mode is in the page; the ones the current mode leaves
                out are hidden, like a closed tab, so search engines read the whole procedure. */}
            {aircraft.checklist.map((fullPhase: ChecklistPhase) => {
              const phaseId = fullPhase.id;
              const phase = shownPhases.get(phaseId);
              if (!phase) {
                return (
                  <div key={phaseId} hidden>
                    <FoldedPhase phase={fullPhase} getItemKey={checklist.getItemKey} />
                  </div>
                );
              }
              return (
                <div
                  key={phaseId}
                  id={`phase-${phaseId}`}
                  ref={(el) => checklist.setPhaseRef(phaseId, el)}
                  className="scroll-mt-36 md:scroll-mt-24"
                >
                  <PhaseGroup
                    phase={phase}
                    allItems={fullPhase}
                    completedItems={checklist.completedItems}
                    toggleItem={checklist.handleToggleItem}
                    checkAllInPhase={checklist.handleCheckAllInPhase}
                    getItemKey={checklist.getItemKey}
                  />
                </div>
              );
            })}

            {checklist.progress === 100 && (
              <div className="print:hidden! mt-8 p-6 border border-success/30 bg-surface/50 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
                <div>
                  <h3 className="text-xs font-bold uppercase text-success mb-1">Flight Complete</h3>
                  <p className="text-sm text-muted">
                    Procedures complete. Engines off and systems secured. Aircraft is safe and
                    parked.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase bg-success text-inverted hover:bg-success/90 cursor-pointer transition-all self-start md:self-auto"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Reset Flight</span>
                </button>
              </div>
            )}
          </div>

          {/* Print and Reset. Printing shows the list in the current mode on white paper; the
              browser's print dialog also saves it as a PDF. */}
          <div className="max-w-6xl mx-auto mt-8 md:mt-12 pt-5 border-t border-border flex justify-center md:justify-end gap-3 print:hidden!">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-xs text-muted hover:text-primary border border-border hover:border-muted transition-all"
            >
              <Printer size={14} aria-hidden="true" />
              <span>Print or Save as PDF</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-xs text-muted hover:text-danger border border-border hover:border-danger/50 transition-all"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reset Flight</span>
            </button>
          </div>

          {!local && (
            <>
              <div className="max-w-6xl mx-auto">
                <ChecklistAbout
                  aircraft={aircraft}
                  fullCount={checklist.fullCount}
                  normalCount={checklist.normalCount}
                  quickCount={checklist.quickCount}
                  lastUpdated={lastUpdated}
                />
              </div>

              <div className="max-w-6xl mx-auto print:hidden!">
                <ChecklistRelated aircraft={aircraft} />
              </div>
            </>
          )}
        </div>

        {!local && (
          <ReportPanel
            isOpen={reportOpen}
            onClose={handleReportClose}
            aircraftSlug={aircraft.slug}
            aircraftName={aircraftName}
            triggerRef={reportTriggerRef}
          />
        )}

        <CompletionModal
          isOpen={showCompletionModal}
          onClose={handleModalClose}
          aircraftName={aircraftName}
          onResetFlight={checklist.handleResetFlight}
        />
      </div>
    </>
  );
};

export default ChecklistView;
