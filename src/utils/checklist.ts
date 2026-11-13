import { ChecklistItem, ChecklistPhase } from '../types';
import type { ChecklistMode } from '../components/ui/ModeToggle';

/** Phases with fewer than this many items (after filtering) get hidden. */
export const PHASE_MIN_ITEMS = 4;

export const MODE_DESCRIPTIONS: Record<ChecklistMode, string> = {
  quick: 'Minimum items to fly the sim. Skips real-world airmanship and extended procedures.',
  normal: 'Standard day-to-day procedures for a realistic flight experience.',
  full: 'All items including extended study-mode procedures and real-world airmanship.',
};

export function getItemTier(item: ChecklistItem): 'quick' | 'normal' | 'full' {
  if (item.tier) return item.tier;
  if (item.quickStart) return 'quick';
  return 'full';
}

export function itemVisibleInMode(item: ChecklistItem, mode: ChecklistMode): boolean {
  const tier = getItemTier(item);
  if (mode === 'full') return true;
  if (mode === 'normal') return tier === 'quick' || tier === 'normal';
  return tier === 'quick';
}

/**
 * The checklist as shown in `mode`. Phases left with fewer than `minPhaseItems`
 * items are hidden; My Hangar's local checklists pass 1, so small phases stay.
 */
export function filterChecklist(
  checklist: ChecklistPhase[],
  mode: ChecklistMode,
  minPhaseItems: number = PHASE_MIN_ITEMS,
): ChecklistPhase[] {
  if (mode === 'full') return checklist;
  return checklist
    .map((phase) => ({
      ...phase,
      groups: phase.groups
        .map((g) => ({ ...g, items: g.items.filter((i) => itemVisibleInMode(i, mode)) }))
        .filter((g) => g.items.length > 0),
    }))
    .filter((phase) => {
      const count = phase.groups.reduce((acc, g) => acc + g.items.length, 0);
      return count >= minPhaseItems;
    });
}

export function countItems(checklist: ChecklistPhase[]): number {
  return checklist.reduce(
    (acc, p) => acc + p.groups.reduce((gAcc, g) => gAcc + g.items.length, 0),
    0,
  );
}
