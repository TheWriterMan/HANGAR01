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
  newId,
  renameLocalChecklist,
  replaceLocalChecklistItems,
  ticksAfterReplace,
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

  it('renames, and replaces items keeping only the ticks whose phase/id still exist', async () => {
    const saved = await addLocalChecklist({ name: 'Old', sim: 'MSFS' }, checklist);
    if (!saved.ok) throw new Error('not saved');
    const { id } = saved.checklist;

    const renamed = await renameLocalChecklist(id, 'New name', new Date('2030-01-01'));
    if (!renamed.ok) throw new Error('not renamed');
    expect(renamed.checklist.meta).toEqual({ name: 'New name', sim: 'MSFS' });
    expect(renamed.checklist.updatedAt).toBe('2030-01-01T00:00:00.000Z');

    store.set(
      progressKey(id),
      JSON.stringify({ v: 2, checked: ['preflight/battery', 'preflight/gone'], updatedAt: 'x' }),
    );
    const next: ChecklistPhase[] = [
      {
        id: 'preflight',
        title: 'Preflight',
        groups: [
          {
            title: 'Preflight',
            items: [
              { id: 'beacon', label: 'Beacon', action: 'ON', tier: 'quick' },
              { id: 'battery', label: 'Battery', action: 'ON', tier: 'quick' },
            ],
          },
        ],
      },
    ];
    const replaced = await replaceLocalChecklistItems(id, next);
    if (!replaced.ok) throw new Error('not replaced');
    expect(replaced.checklist.checklist).toEqual(next);
    expect(replaced.checklist.meta.name).toBe('New name');
    expect(JSON.parse(store.get(progressKey(id))!).checked).toEqual(['preflight/battery']);

    // Nothing left to keep: the progress entry goes.
    await replaceLocalChecklistItems(id, [{ ...next[0], id: 'renamed-phase' }]);
    expect(store.has(progressKey(id))).toBe(false);

    // Deleted in another tab, say.
    expect(await renameLocalChecklist('missing', 'x')).toEqual({ ok: false, reason: 'missing' });
    expect(await replaceLocalChecklistItems('missing', next)).toEqual({
      ok: false,
      reason: 'missing',
    });
    await deleteLocalChecklist(id);
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

describe('ticksAfterReplace', () => {
  const phase = (id: string, title: string, items: string[]): ChecklistPhase => ({
    id,
    title,
    groups: [
      { title, items: items.map((i) => ({ id: i, label: i, action: 'ON', tier: 'quick' })) },
    ],
  });

  it('drops a tick when its phase id now belongs to another phase (non-Latin titles reordered)', () => {
    // Cyrillic and Chinese titles have no latin letters, so their ids are item, item-2, item-3.
    const before = [
      phase('item', 'Предполётная', ['item', 'item-2']),
      phase('item-2', '起飞前', ['item', 'item-2']),
      phase('item-3', 'Посадка', ['item']),
    ];
    // The same phases, reordered: every id now names a different phase.
    const after = [
      phase('item', '起飞前', ['item', 'item-2']),
      phase('item-2', 'Посадка', ['item']),
      phase('item-3', 'Предполётная', ['item', 'item-2']),
    ];
    expect(ticksAfterReplace(['item/item', 'item-2/item-2', 'item-3/item'], before, after)).toEqual(
      [],
    );
  });

  it('keeps ticks whose phase kept its id and title and whose item still exists', () => {
    const before = [
      phase('item', 'Предполётная', ['item', 'item-2']),
      phase('taxi', 'Taxi', ['a']),
    ];
    const after = [phase('item', 'Предполётная', ['item']), phase('taxi', 'Taxi', ['a', 'b'])];
    expect(ticksAfterReplace(['item/item', 'item/item-2', 'taxi/a'], before, after)).toEqual([
      'item/item',
      'taxi/a',
    ]);
  });
});

describe('newId', () => {
  it('makes a v4 UUID without crypto.randomUUID', () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      const a = newId();
      expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(newId()).not.toBe(a);
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true });
    }
  });
});
