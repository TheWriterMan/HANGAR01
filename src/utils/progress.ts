import type { ChecklistPhase } from '../types';
import { readJSON, readStorage, removeStorage, writeStorage } from './storage';

/**
 * Checklist progress, stored per aircraft in localStorage.
 *
 * v2 (current): `hangar01:progress:v2:<slug>` → { v: 2, checked: ["<phaseId>/<itemId>"], updatedAt }.
 * Keys are the permanent ids from the checklist data, so inserting, removing or
 * reordering items can only drop a tick, never move it to another item.
 *
 * v1 (legacy): `HANGAR01_progress_<slug>` → { "<phaseId>:<groupIndex>:<itemIndex>": true }.
 * Positional. Migrated to v2 on first load; see loadProgress.
 */

export interface ProgressV2 {
  v: 2;
  checked: string[];
  updatedAt: string;
}

export const progressKey = (slug: string) => `hangar01:progress:v2:${slug}`;

/**
 * Kept for one release after v2 ships, for rollback safety. The next release
 * should delete it on load.
 */
export const legacyProgressKey = (slug: string) => `HANGAR01_progress_${slug}`;

export const itemKey = (phaseId: string, itemId: string) => `${phaseId}/${itemId}`;

/** Every valid progress key in a checklist. */
export function collectItemKeys(checklist: ChecklistPhase[]): Set<string> {
  const keys = new Set<string>();
  for (const phase of checklist) {
    for (const group of phase.groups) {
      for (const item of group.items) keys.add(itemKey(phase.id, item.id));
    }
  }
  return keys;
}

// ─── Validation ─────────────────────────────────────────────────────────────

function isProgressV2(value: unknown): value is ProgressV2 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 2 &&
    Array.isArray(v.checked) &&
    v.checked.every((k) => typeof k === 'string') &&
    typeof v.updatedAt === 'string'
  );
}

function isLegacyProgress(value: unknown): value is Record<string, boolean> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === 'boolean')
  );
}

// ─── Migration ──────────────────────────────────────────────────────────────

const LEGACY_KEY = /^(.+):(\d+):(\d+)$/;

/**
 * Converts ticked v1 positional keys to v2 keys by resolving each position
 * against the current checklist. Unticked (`false`) entries and positions that
 * no longer exist are dropped.
 */
export function migrateLegacyProgress(
  legacy: Record<string, boolean>,
  checklist: ChecklistPhase[],
): string[] {
  const out = new Set<string>();
  for (const [key, ticked] of Object.entries(legacy)) {
    if (ticked !== true) continue;
    const match = LEGACY_KEY.exec(key);
    if (!match) continue;
    const [, legacyPhaseKey, gi, ii] = match;
    // v1 keyed phases by `phase.id ?? phase.title`.
    const phase =
      checklist.find((p) => p.id === legacyPhaseKey) ??
      checklist.find((p) => p.title === legacyPhaseKey);
    const item = phase?.groups[Number(gi)]?.items[Number(ii)];
    if (phase && item) out.add(itemKey(phase.id, item.id));
  }
  return [...out];
}

// ─── Load / save ────────────────────────────────────────────────────────────

/**
 * Returns the checked keys for an aircraft. Uses v2 when present, otherwise
 * migrates v1. Keys that no longer match an item are ignored. Pure read:
 * the caller's next saveProgress writes the migrated v2 entry.
 */
export function loadProgress(slug: string, checklist: ChecklistPhase[]): string[] {
  const valid = collectItemKeys(checklist);
  const v2 = readJSON(progressKey(slug), isProgressV2);
  if (v2) return [...new Set(v2.checked)].filter((k) => valid.has(k));

  const legacy = readJSON(legacyProgressKey(slug), isLegacyProgress);
  return legacy ? migrateLegacyProgress(legacy, checklist) : [];
}

const sameKeys = (a: string[], b: string[]) =>
  a.length === b.length && a.every((k, i) => k === b[i]);

export function saveProgress(slug: string, checked: Iterable<string>, now = new Date()): void {
  const next = [...new Set(checked)].sort();
  const stored = readJSON(progressKey(slug), isProgressV2);
  if (stored && sameKeys([...new Set(stored.checked)].sort(), next)) return;

  // While a legacy entry exists, an empty v2 entry must be written: removing it
  // would make the next load migrate the old ticks back after a reset.
  if (next.length === 0 && readStorage(legacyProgressKey(slug)) === null) {
    removeStorage(progressKey(slug));
    return;
  }

  const value: ProgressV2 = { v: 2, checked: next, updatedAt: now.toISOString() };
  writeStorage(progressKey(slug), JSON.stringify(value));
}
