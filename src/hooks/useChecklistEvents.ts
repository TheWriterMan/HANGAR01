import { useCallback, useEffect, useRef } from 'react';
import { ChecklistItem, ChecklistPhase } from '../types';
import { ChecklistMode } from '../components/ui/ModeToggle';
import { track } from '../utils/events';
import { hasSavedState } from './useChecklistState';

interface ChecklistEventsInput {
  slug: string;
  loaded: boolean;
  mode: ChecklistMode;
  checklistData: ChecklistPhase[];
  completedItems: Record<string, boolean>;
  getItemKey: (item: ChecklistItem) => string;
}

/** How many items in the shown view are ticked, and the id of the furthest phase with one. */
function tickSummary(
  phases: ChecklistPhase[],
  completed: Record<string, boolean>,
  getItemKey: (item: ChecklistItem) => string,
): { ticked: number; phase: string } {
  let ticked = 0;
  let phase = 'none';
  for (const p of phases) {
    for (const group of p.groups) {
      for (const item of group.items) {
        if (completed[getItemKey(item)]) {
          ticked += 1;
          phase = p.id;
        }
      }
    }
  }
  return { ticked, phase };
}

/**
 * The checklist page's usage events: opened, view switched, printed, report
 * opened and left. Only counts and ids are sent (see src/utils/events.ts),
 * never which items were ticked.
 */
export function useChecklistEvents(input: ChecklistEventsInput) {
  const { slug, loaded, mode } = input;
  // The latest values, read when the page is left.
  const latest = useRef(input);
  useEffect(() => {
    latest.current = input;
  });
  const openedAt = useRef<number | null>(null);
  // Moving to another page in the app changes the address before the leave is sent.
  const openedPath = useRef('');
  const returning = useRef(false);
  const leaveSent = useRef(false);

  // Opened: once saved state has loaded, so the view is the one the visitor sees.
  useEffect(() => {
    if (!loaded || openedAt.current !== null) return;
    openedAt.current = Date.now();
    openedPath.current = window.location.pathname;
    returning.current = hasSavedState(slug);
    track('checklist_open', { aircraft: slug, view: latest.current.mode });
  }, [loaded, slug]);

  // Left: the first of closing the tab, hiding it (phones rarely fire pagehide)
  // or moving to another page in the app. Sent once per open.
  useEffect(() => {
    const leave = () => {
      if (leaveSent.current || openedAt.current === null) return;
      leaveSent.current = true;
      const { checklistData, completedItems, getItemKey, mode: view } = latest.current;
      const { ticked, phase } = tickSummary(checklistData, completedItems, getItemKey);
      const minutes = Math.round((Date.now() - openedAt.current) / 6000) / 10;
      track(
        'checklist_leave',
        {
          aircraft: slug,
          view,
          ticked,
          phase,
          minutes,
          returning: returning.current,
        },
        openedPath.current,
      );
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden') leave();
    };
    // Ctrl+P and the Print button both fire beforeprint.
    const onPrint = () => {
      if (openedAt.current !== null) track('print', { aircraft: slug, view: latest.current.mode });
    };
    window.addEventListener('pagehide', leave);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('beforeprint', onPrint);
    return () => {
      window.removeEventListener('pagehide', leave);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('beforeprint', onPrint);
      leave();
    };
  }, [slug]);

  const viewSwitched = useCallback(
    (to: ChecklistMode) => {
      if (to !== mode) track('view_switch', { aircraft: slug, from: mode, to });
    },
    [slug, mode],
  );

  const reportOpened = useCallback(() => track('report_open', { aircraft: slug }), [slug]);

  return { viewSwitched, reportOpened };
}
