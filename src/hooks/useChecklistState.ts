import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Aircraft, ChecklistItem, ChecklistPhase } from '../types';
import { ChecklistMode } from '../components/ui/ModeToggle';
import { filterChecklist, countItems } from '../utils/checklist';
import {
  itemKey,
  legacyProgressKey,
  loadProgress,
  progressKey,
  saveProgress,
} from '../utils/progress';
import { readStorage, writeStorage } from '../utils/storage';
import { useReducedMotion } from './useReducedMotion';
import { useHydrated } from './useHydrated';

// ─── Persistence ────────────────────────────────────────────────────────────

const modeKey = (slug: string) => `HANGAR01_mode_${slug}`;

function loadMode(slug: string): ChecklistMode {
  const saved = readStorage(modeKey(slug));
  return saved === 'quick' || saved === 'normal' || saved === 'full' ? saved : 'normal';
}

function loadCompleted(slug: string, checklist: ChecklistPhase[]): Record<string, boolean> {
  return Object.fromEntries(loadProgress(slug, checklist).map((k) => [k, true]));
}

/** Whether this browser had a chosen mode or ticks saved for the aircraft. */
export function hasSavedState(slug: string): boolean {
  return (
    readStorage(modeKey(slug)) !== null ||
    readStorage(progressKey(slug)) !== null ||
    readStorage(legacyProgressKey(slug)) !== null
  );
}

const checkedKeys = (items: Record<string, boolean>) => Object.keys(items).filter((k) => items[k]);

// ─── Item keys ──────────────────────────────────────────────────────────────

/**
 * Maps every item object in the full (unfiltered) checklist to its progress
 * key, `<phaseId>/<itemId>`. Items don't carry their phase id, hence the map.
 *
 * Because filterChecklist preserves item object references (it only filters,
 * never clones items), this map works across all mode-filtered views.
 */
function buildItemKeyMap(checklist: ChecklistPhase[]): Map<ChecklistItem, string> {
  const map = new Map<ChecklistItem, string>();
  for (const phase of checklist) {
    for (const group of phase.groups) {
      for (const item of group.items) map.set(item, itemKey(phase.id, item.id));
    }
  }
  return map;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export interface UseChecklistStateOptions {
  /** Fires when a user action (toggle or check-all) completes every visible item. */
  onComplete?: () => void;
  /**
   * true (the checklist page): mode and progress are saved per aircraft in localStorage.
   * false (the home hero's working copy): they live in this component only; nothing is
   * read from or written to the aircraft's saved progress.
   */
  persist?: boolean;
  /**
   * 'scroll' (the checklist page): every phase is on the page; picking one scrolls to it and
   * scrolling tracks it. 'switch' (the home hero): one phase is shown at a time; picking one
   * shows it, without scrolling the window.
   */
  phaseNav?: 'scroll' | 'switch';
}

export interface UseChecklistStateReturn {
  /** Saved mode and progress have loaded (or there is nothing to load). */
  loaded: boolean;

  // Mode
  mode: ChecklistMode;
  setMode: (m: ChecklistMode) => void;
  showModeToggle: boolean;
  fullCount: number;
  normalCount: number;
  quickCount: number;
  checklistData: ChecklistPhase[];

  // Completion
  completedItems: Record<string, boolean>;
  handleToggleItem: (key: string) => void;
  handleCheckAllInPhase: (phase: ChecklistPhase, state: boolean) => void;
  /** Asks for confirmation. Returns true when progress was actually reset. */
  handleResetFlight: () => boolean;
  progress: number;
  /** Resolve an item's stable key from its object reference. */
  getItemKey: (item: ChecklistItem) => string;

  // Scroll/phase tracking
  activePhaseId: string;
  handlePhaseSelect: (id: string) => void;
  setPhaseRef: (id: string, el: HTMLDivElement | null) => void;
}

export function useChecklistState(
  aircraft: Aircraft,
  { onComplete, persist = true, phaseNav = 'scroll' }: UseChecklistStateOptions = {},
): UseChecklistStateReturn {
  const prefersReducedMotion = useReducedMotion();
  const { slug, checklist: fullChecklist } = aircraft;

  // ─── Per-aircraft state from localStorage ────────────────────────────────────
  // The prerendered page and the hydration render use the defaults, so the first
  // client render matches the static HTML. Saved state loads right after
  // hydration, or immediately on a client-side navigation.
  const hydrated = useHydrated();
  // Without persistence the defaults are the state, so there is nothing to load.
  const [loadedSlug, setLoadedSlug] = useState<string | null>(() =>
    hydrated || !persist ? slug : null,
  );
  const [mode, setModeState] = useState<ChecklistMode>(() =>
    hydrated && persist ? loadMode(slug) : 'normal',
  );
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() =>
    hydrated && persist ? loadCompleted(slug, fullChecklist) : {},
  );
  const [trackedPhaseId, setActivePhaseId] = useState('');

  // Hydration finished, or the aircraft changed under the same component
  // instance: load during render (React's "adjust state when a prop changes"
  // pattern) so no frame shows the previous aircraft's progress.
  if (hydrated && loadedSlug !== slug) {
    setLoadedSlug(slug);
    setModeState(persist ? loadMode(slug) : 'normal');
    setCompletedItems(persist ? loadCompleted(slug, fullChecklist) : {});
    setActivePhaseId('');
  }

  // loadProgress has already moved a legacy checklist to v2 and deleted the old entry.
  // Skipped until saved state has loaded, so the defaults never overwrite it.
  useEffect(() => {
    if (persist && loadedSlug === slug) saveProgress(slug, checkedKeys(completedItems));
  }, [persist, slug, loadedSlug, completedItems]);

  const setMode = useCallback(
    (m: ChecklistMode) => {
      setModeState(m);
      if (persist) writeStorage(modeKey(slug), m);
    },
    [persist, slug],
  );

  // ─── Item keys ────────────────────────────────────────────────────────────────
  const itemKeyMap = useMemo(() => buildItemKeyMap(fullChecklist), [fullChecklist]);
  const getItemKey = useCallback(
    (item: ChecklistItem) => itemKeyMap.get(item) ?? 'unknown',
    [itemKeyMap],
  );

  // ─── Filtered checklists ──────────────────────────────────────────────────────
  const quickChecklist = useMemo(() => filterChecklist(fullChecklist, 'quick'), [fullChecklist]);
  const normalChecklist = useMemo(() => filterChecklist(fullChecklist, 'normal'), [fullChecklist]);

  const fullCount = useMemo(() => countItems(fullChecklist), [fullChecklist]);
  const normalCount = useMemo(() => countItems(normalChecklist), [normalChecklist]);
  const quickCount = useMemo(() => countItems(quickChecklist), [quickChecklist]);

  const showModeToggle = quickCount > 0 || normalCount < fullCount;

  const checklistData = useMemo(() => {
    if (mode === 'quick') return quickChecklist;
    if (mode === 'normal') return normalChecklist;
    return fullChecklist;
  }, [mode, quickChecklist, normalChecklist, fullChecklist]);

  const visibleKeys = useMemo(
    () => checklistData.flatMap((p) => p.groups.flatMap((g) => g.items.map(getItemKey))),
    [checklistData, getItemKey],
  );

  const checkedCount = (items: Record<string, boolean>) =>
    visibleKeys.reduce((n, k) => (items[k] ? n + 1 : n), 0);

  // ─── Completion handlers ──────────────────────────────────────────────────────
  // Completion is detected here, on the user's action, rather than in an effect
  // watching `progress`. Loading a finished checklist or switching modes never
  // opens the completion modal.
  const applyProgress = (next: Record<string, boolean>) => {
    const total = visibleKeys.length;
    const wasComplete = total > 0 && checkedCount(completedItems) === total;
    const isComplete = total > 0 && checkedCount(next) === total;
    setCompletedItems(next);
    if (isComplete && !wasComplete) onComplete?.();
  };

  const handleToggleItem = (itemKey: string) => {
    applyProgress({ ...completedItems, [itemKey]: !completedItems[itemKey] });
  };

  const handleCheckAllInPhase = (phase: ChecklistPhase, targetState: boolean) => {
    const updates: Record<string, boolean> = {};
    for (const group of phase.groups) {
      for (const item of group.items) updates[getItemKey(item)] = targetState;
    }
    applyProgress({ ...completedItems, ...updates });
  };

  const handleResetFlight = () => {
    if (!window.confirm('Reset all checklist progress for this aircraft?')) return false;
    setCompletedItems({});
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    return true;
  };

  const progress =
    visibleKeys.length === 0 ? 0 : (checkedCount(completedItems) / visibleKeys.length) * 100;

  // ─── Phase scroll tracking ────────────────────────────────────────────────────
  const isManualScrollRef = useRef(false);
  const manualScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fall back to the first visible phase when the tracked one is hidden by a
  // mode switch (derived, not synced in an effect).
  const activePhaseId = checklistData.some((p) => p.id === trackedPhaseId)
    ? trackedPhaseId
    : (checklistData[0]?.id ?? '');

  const setPhaseRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) phaseRefs.current.set(id, el);
    else phaseRefs.current.delete(id);
  }, []);

  // Scroll-based ToC: track which phase is at the top of the viewport
  useEffect(() => {
    if (phaseNav !== 'scroll' || checklistData.length === 0) return;

    const handleScroll = () => {
      if (isManualScrollRef.current) return;

      const triggerLine = window.innerHeight * 0.35;
      let currentPhaseId = checklistData[0].id;

      for (const phase of checklistData) {
        const pid = phase.id;
        const el = phaseRefs.current.get(pid);
        if (el && el.getBoundingClientRect().top <= triggerLine) currentPhaseId = pid;
      }

      setActivePhaseId((prev) => (prev === currentPhaseId ? prev : currentPhaseId));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const frame = window.requestAnimationFrame(handleScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [checklistData, phaseNav]);

  useEffect(
    () => () => {
      if (manualScrollTimeout.current) clearTimeout(manualScrollTimeout.current);
    },
    [],
  );

  const handlePhaseSelect = useCallback(
    (phaseId: string) => {
      isManualScrollRef.current = true;
      if (manualScrollTimeout.current) clearTimeout(manualScrollTimeout.current);
      manualScrollTimeout.current = setTimeout(() => {
        isManualScrollRef.current = false;
      }, 1200);

      setActivePhaseId(phaseId);
      if (phaseNav !== 'scroll') return;

      const element = document.getElementById(`phase-${phaseId}`);
      if (element) {
        const headerOffset = 120;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - headerOffset,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }
    },
    [prefersReducedMotion, phaseNav],
  );

  return {
    loaded: loadedSlug === slug,
    mode,
    setMode,
    showModeToggle,
    fullCount,
    normalCount,
    quickCount,
    checklistData,
    completedItems,
    handleToggleItem,
    handleCheckAllInPhase,
    handleResetFlight,
    progress,
    getItemKey,
    activePhaseId,
    handlePhaseSelect,
    setPhaseRef,
  };
}
