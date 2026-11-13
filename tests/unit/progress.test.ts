import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Aircraft, ChecklistPhase } from '../../src/types';
import {
  collectItemKeys,
  legacyProgressKey,
  loadProgress,
  migrateLegacyProgress,
  progressKey,
  saveProgress,
} from '../../src/utils/progress';

// ─── In-memory localStorage (src/utils/storage.ts reads window.localStorage) ─

const store = new Map<string, string>();
const memoryStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
};
Object.defineProperty(globalThis, 'window', {
  value: { localStorage: memoryStorage },
  configurable: true,
});

beforeEach(() => store.clear());

const readV2 = (slug: string) => JSON.parse(store.get(progressKey(slug)) ?? 'null');

// ─── Fixture ────────────────────────────────────────────────────────────────

const item = (id: string) => ({ id, label: id, action: 'SET' });

const checklist: ChecklistPhase[] = [
  {
    id: 'preflight',
    title: 'Preflight',
    groups: [
      { title: 'Power', items: [item('battery'), item('external-power')] },
      { title: 'Lights', items: [item('beacon'), item('external-power-2')] },
    ],
  },
  {
    id: 'shutdown-secure',
    title: 'Shutdown & Secure',
    groups: [{ title: 'Secure', items: [item('battery'), item('beacon')] }],
  },
];

// ─── Migration ──────────────────────────────────────────────────────────────

describe('migrateLegacyProgress', () => {
  it('converts positional keys to <phaseId>/<itemId> against the current tree', () => {
    const legacy = {
      'preflight:0:0': true,
      'preflight:1:1': true,
      'shutdown-secure:0:0': true,
    };
    expect(migrateLegacyProgress(legacy, checklist).sort()).toEqual([
      'preflight/battery',
      'preflight/external-power-2',
      'shutdown-secure/battery',
    ]);
  });

  it('keeps same-id items in different phases apart', () => {
    const out = migrateLegacyProgress({ 'shutdown-secure:0:1': true }, checklist);
    expect(out).toEqual(['shutdown-secure/beacon']);
  });

  it('drops unticked, unresolvable and malformed keys', () => {
    const legacy = {
      'preflight:0:1': false, // unticked (older builds stored false)
      'preflight:0:9': true, // item index out of range
      'preflight:7:0': true, // group index out of range
      'cruise:0:0': true, // phase no longer exists
      'not-a-key': true,
      'preflight/battery': true, // already v2-shaped, not a legacy key
    };
    expect(migrateLegacyProgress(legacy, checklist)).toEqual([]);
  });

  it('resolves phases keyed by title (v1 fell back to phase.title without an id)', () => {
    expect(migrateLegacyProgress({ 'Shutdown & Secure:0:1': true }, checklist)).toEqual([
      'shutdown-secure/beacon',
    ]);
  });
});

// ─── Load / save ────────────────────────────────────────────────────────────

describe('loadProgress / saveProgress', () => {
  const slug = 'test-aircraft';

  it('returns nothing for a fresh aircraft and stores nothing', () => {
    expect(loadProgress(slug, checklist)).toEqual([]);
    saveProgress(slug, []);
    expect(store.size).toBe(0);
  });

  it('migrates legacy progress on first load into v2 and deletes the legacy entry', () => {
    store.set(
      legacyProgressKey(slug),
      JSON.stringify({ 'preflight:0:0': true, 'preflight:1:0': true }),
    );

    const checked = loadProgress(slug, checklist);
    expect(checked.sort()).toEqual(['preflight/battery', 'preflight/beacon']);
    expect(readV2(slug).checked).toEqual(['preflight/battery', 'preflight/beacon']);
    expect(store.has(legacyProgressKey(slug))).toBe(false);

    // The next save sees the same ticks and leaves the entry alone.
    const before = store.get(progressKey(slug));
    saveProgress(slug, checked);
    expect(store.get(progressKey(slug))).toBe(before);
  });

  it('deletes a legacy entry left beside v2 without touching the v2 ticks', () => {
    store.set(legacyProgressKey(slug), JSON.stringify({ 'preflight:0:0': true }));
    saveProgress(slug, ['shutdown-secure/beacon']);
    expect(loadProgress(slug, checklist)).toEqual(['shutdown-secure/beacon']);
    expect(store.has(legacyProgressKey(slug))).toBe(false);
  });

  it('deletes a legacy entry that is corrupt or has nothing ticked', () => {
    store.set(legacyProgressKey(slug), 'not json');
    expect(loadProgress(slug, checklist)).toEqual([]);
    expect(store.size).toBe(0);
    store.set(legacyProgressKey(slug), JSON.stringify({ 'preflight:0:0': false }));
    expect(loadProgress(slug, checklist)).toEqual([]);
    expect(store.size).toBe(0);
  });

  it('keeps the legacy entry when the v2 entry cannot be written', () => {
    const legacy = JSON.stringify({ 'preflight:0:0': true });
    store.set(legacyProgressKey(slug), legacy);
    const realSet = memoryStorage.setItem;
    memoryStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    try {
      expect(loadProgress(slug, checklist)).toEqual(['preflight/battery']);
      expect(store.get(legacyProgressKey(slug))).toBe(legacy);
    } finally {
      memoryStorage.setItem = realSet;
    }
  });

  it('does not resurrect legacy ticks after a reset', () => {
    store.set(legacyProgressKey(slug), JSON.stringify({ 'preflight:0:0': true }));
    saveProgress(slug, loadProgress(slug, checklist));
    saveProgress(slug, []); // user resets the flight
    expect(store.size).toBe(0); // the legacy entry went at load, so nothing is left to come back
    expect(loadProgress(slug, checklist)).toEqual([]);
  });

  it('removes the v2 entry when emptied', () => {
    saveProgress(slug, ['preflight/battery']);
    saveProgress(slug, []);
    expect(store.has(progressKey(slug))).toBe(false);
  });

  it('ignores keys that no longer match an item', () => {
    saveProgress(slug, ['preflight/battery', 'preflight/removed-item', 'gone/battery']);
    expect(loadProgress(slug, checklist)).toEqual(['preflight/battery']);
  });

  it('is a no-op when nothing changed (updatedAt is not bumped on every render)', () => {
    saveProgress(slug, ['preflight/beacon', 'preflight/battery'], new Date('2026-01-01T00:00:00Z'));
    saveProgress(slug, ['preflight/battery', 'preflight/beacon'], new Date('2026-06-01T00:00:00Z'));
    expect(readV2(slug).updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('falls back to legacy when the v2 entry is corrupt', () => {
    store.set(progressKey(slug), '{"v":2,"checked":"oops"');
    store.set(legacyProgressKey(slug), JSON.stringify({ 'preflight:0:1': true }));
    expect(loadProgress(slug, checklist)).toEqual(['preflight/external-power']);
  });

  it('survives unavailable storage', () => {
    const throwing = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: throwing },
      configurable: true,
    });
    try {
      expect(loadProgress(slug, checklist)).toEqual([]);
      expect(() => saveProgress(slug, ['preflight/battery'])).not.toThrow();
    } finally {
      Object.defineProperty(globalThis, 'window', {
        value: { localStorage: memoryStorage },
        configurable: true,
      });
    }
  });
});

// ─── Real checklist data ────────────────────────────────────────────────────

describe('content/checklists', () => {
  const dir = resolve(import.meta.dirname, '../../content/checklists');
  const aircraft: Aircraft[] = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf-8')));

  it.each(aircraft.map((a) => [a.slug, a] as const))(
    '%s: every item has a unique key and every legacy tick migrates',
    (_slug, a) => {
      const itemCount = a.checklist.reduce(
        (n, p) => n + p.groups.reduce((m, g) => m + g.items.length, 0),
        0,
      );
      expect(collectItemKeys(a.checklist).size).toBe(itemCount);

      // A user who ticked everything under the old positional scheme.
      const legacy: Record<string, boolean> = {};
      for (const p of a.checklist) {
        p.groups.forEach((g, gi) =>
          g.items.forEach((_, ii) => (legacy[`${p.id}:${gi}:${ii}`] = true)),
        );
      }
      expect(migrateLegacyProgress(legacy, a.checklist)).toHaveLength(itemCount);
    },
  );
});
