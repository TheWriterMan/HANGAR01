import { describe, expect, it } from 'vitest';
import type { ChecklistPhase } from '../../src/types';
import { LOCAL_CHECKLIST_LIMIT } from '../../src/utils/checklistCsv';
import { modeKey, progressKey } from '../../src/utils/progress';

// Node has no IndexedDB, so the wrapper falls back to memory: the path a browser
// without IndexedDB takes. localStorage holds the ticks and mode it clears.
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    },
  },
  configurable: true,
});

const {
  addLocalChecklist,
  deleteLocalChecklist,
  getLocalChecklist,
  isInMemory,
  listLocalChecklists,
  toAircraft,
} = await import('../../src/utils/localChecklists');

const checklist: ChecklistPhase[] = [
  {
    id: 'preflight',
    title: 'Preflight',
    groups: [
      {
        title: 'Preflight',
        items: [{ id: 'battery', label: 'Battery', action: 'ON', tier: 'quick' }],
      },
    ],
  },
];

describe('local checklists without IndexedDB', () => {
  it('saves, lists newest first and deletes with its ticks and mode, in memory', async () => {
    const a = await addLocalChecklist({ name: 'First' }, checklist, new Date('2026-11-01'));
    const b = await addLocalChecklist(
      { name: 'Second', sim: 'MSFS' },
      checklist,
      new Date('2026-11-02'),
    );
    expect(isInMemory()).toBe(true);
    if (!a.ok || !b.ok) throw new Error('not saved');
    expect(a.checklist.id).not.toBe(b.checklist.id);
    expect((await listLocalChecklists()).map((c) => c.meta.name)).toEqual(['Second', 'First']);
    expect(toAircraft(b.checklist)).toMatchObject({
      slug: b.checklist.id,
      model: 'Second',
      flightsim: 'MSFS',
    });

    store.set(
      progressKey(a.checklist.id),
      '{"v":2,"checked":["preflight/battery"],"updatedAt":"x"}',
    );
    store.set(modeKey(a.checklist.id), 'full');
    expect(await deleteLocalChecklist(a.checklist.id)).toBe(true);
    expect(await getLocalChecklist(a.checklist.id)).toBeNull();
    expect(store.has(progressKey(a.checklist.id))).toBe(false);
    expect(store.has(modeKey(a.checklist.id))).toBe(false);
    await deleteLocalChecklist(b.checklist.id);
  });

  it(`refuses a checklist past the limit of ${LOCAL_CHECKLIST_LIMIT}`, async () => {
    for (let i = 0; i < LOCAL_CHECKLIST_LIMIT; i++) {
      expect((await addLocalChecklist({ name: `C${i}` }, checklist)).ok).toBe(true);
    }
    expect(await addLocalChecklist({ name: 'One too many' }, checklist)).toEqual({
      ok: false,
      reason: 'limit',
    });
  });
});
