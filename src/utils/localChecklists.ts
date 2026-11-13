import type { Aircraft, ChecklistPhase } from '../types';
import { countItems } from './checklist';
import { LOCAL_CHECKLIST_LIMIT } from './checklistCsv';
import { loadProgress, modeKey, progressKey, saveProgress } from './progress';
import { removeStorage } from './storage';

/**
 * My Hangar: checklists a visitor imported from CSV, kept in this browser only.
 *
 * IndexedDB database `hangar01`, store `local-checklists`, one record per
 * checklist. Ticks and mode use the same localStorage keys as a built-in
 * checklist, with the local id as the slug (src/utils/progress.ts).
 *
 * Like storage.ts, nothing here throws. Without IndexedDB (some private
 * windows, locked-down browsers) records live in memory for this tab, and
 * `isInMemory()` turns true so the page can say so.
 */

export interface LocalChecklistMeta {
  /** The aircraft's name as the visitor typed it. Required. */
  name: string;
  manufacturer?: string;
  sim?: string;
  addon?: string;
}

export interface LocalChecklist {
  /** crypto.randomUUID(): never collides with a built-in slug. */
  id: string;
  schemaVersion: 1;
  meta: LocalChecklistMeta;
  checklist: ChecklistPhase[];
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'hangar01';
const STORE = 'local-checklists';

const memory = new Map<string, LocalChecklist>();
let inMemory = false;
let dbPromise: Promise<IDBDatabase | null> | null = null;

/** True once IndexedDB turned out to be unavailable: records last only as long as the tab. */
export const isInMemory = () => inMemory;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => {
        const db = request.result;
        // A later version opened in another tab: step aside, reopen on next use.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  }).then((db) => {
    if (!db) inMemory = true;
    return db;
  });
  return dbPromise;
}

/** Runs one request in its own transaction. Resolves undefined on any failure. */
async function run<T>(
  mode: IDBTransactionMode,
  makeRequest: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<{ ok: true; value: T } | { ok: false }> {
  const db = await openDb();
  if (!db) return { ok: false };
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, mode);
      const request = makeRequest(tx.objectStore(STORE));
      let value: T;
      request.onsuccess = () => {
        value = request.result;
      };
      tx.oncomplete = () => resolve({ ok: true, value });
      tx.onerror = () => resolve({ ok: false });
      tx.onabort = () => resolve({ ok: false });
    } catch {
      resolve({ ok: false });
    }
  });
}

function isLocalChecklist(value: unknown): value is LocalChecklist {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const meta = v.meta as Record<string, unknown> | undefined;
  return (
    typeof v.id === 'string' &&
    v.schemaVersion === 1 &&
    typeof meta === 'object' &&
    meta !== null &&
    typeof meta.name === 'string' &&
    Array.isArray(v.checklist) &&
    typeof v.createdAt === 'string' &&
    typeof v.updatedAt === 'string'
  );
}

/** Newest first. */
const byNewest = (a: LocalChecklist, b: LocalChecklist) => b.updatedAt.localeCompare(a.updatedAt);

export async function listLocalChecklists(): Promise<LocalChecklist[]> {
  const result = await run('readonly', (store) => store.getAll());
  const records = result.ok ? (result.value as unknown[]) : inMemory ? [...memory.values()] : [];
  return records.filter(isLocalChecklist).sort(byNewest);
}

export async function getLocalChecklist(id: string): Promise<LocalChecklist | null> {
  const result = await run('readonly', (store) => store.get(id));
  const record = result.ok ? (result.value as unknown) : inMemory ? memory.get(id) : null;
  return isLocalChecklist(record) ? record : null;
}

export type SaveResult =
  { ok: true; checklist: LocalChecklist } | { ok: false; reason: 'limit' | 'storage' };

export async function addLocalChecklist(
  meta: LocalChecklistMeta,
  checklist: ChecklistPhase[],
  now = new Date(),
): Promise<SaveResult> {
  const existing = await listLocalChecklists();
  if (existing.length >= LOCAL_CHECKLIST_LIMIT) return { ok: false, reason: 'limit' };

  const stamp = now.toISOString();
  const record: LocalChecklist = {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    meta,
    checklist,
    createdAt: stamp,
    updatedAt: stamp,
  };
  if (inMemory) {
    memory.set(record.id, record);
    return { ok: true, checklist: record };
  }
  const result = await run('readwrite', (store) => store.add(record));
  if (!result.ok) return { ok: false, reason: 'storage' };
  requestPersistence();
  return { ok: true, checklist: record };
}

/** Writes a changed record (rename, replace). Null when it's gone or the write failed. */
async function updateLocalChecklist(
  id: string,
  change: (record: LocalChecklist) => LocalChecklist,
  now: Date,
): Promise<LocalChecklist | null> {
  const current = await getLocalChecklist(id);
  if (!current) return null;
  const next = { ...change(current), id, updatedAt: now.toISOString() };
  if (inMemory) {
    memory.set(id, next);
    return next;
  }
  return (await run('readwrite', (store) => store.put(next))).ok ? next : null;
}

export async function renameLocalChecklist(
  id: string,
  name: string,
  now = new Date(),
): Promise<LocalChecklist | null> {
  return updateLocalChecklist(id, (record) => ({ ...record, meta: { ...record.meta, name } }), now);
}

/**
 * Swaps in the items of a new CSV. Ticks stay on every `<phaseId>/<itemId>` that still
 * exists and are dropped for the rest, so a removed item can't come back ticked.
 */
export async function replaceLocalChecklistItems(
  id: string,
  checklist: ChecklistPhase[],
  now = new Date(),
): Promise<LocalChecklist | null> {
  const next = await updateLocalChecklist(id, (record) => ({ ...record, checklist }), now);
  if (next) saveProgress(id, loadProgress(id, checklist), now);
  return next;
}

/** Deletes the checklist, its ticks and its mode. */
export async function deleteLocalChecklist(id: string): Promise<boolean> {
  let ok: boolean;
  if (inMemory) ok = memory.delete(id);
  else ok = (await run('readwrite', (store) => store.delete(id))).ok;
  if (ok) {
    removeStorage(progressKey(id));
    removeStorage(modeKey(id));
  }
  return ok;
}

/** Asks the browser not to evict site storage under pressure. Best effort. */
function requestPersistence(): void {
  try {
    void navigator.storage?.persist?.().catch(() => {});
  } catch {
    /* not supported */
  }
}

/** A local checklist in the shape ChecklistView renders. */
export function toAircraft(local: LocalChecklist): Aircraft {
  return {
    slug: local.id,
    model: local.meta.name,
    manufacturer: local.meta.manufacturer ?? '',
    addon: local.meta.addon,
    flightsim: local.meta.sim,
    description: '',
    // Required by the type, read only by the related-checklists list, which a
    // local checklist doesn't show.
    systemsType: 'piston',
    checklist: local.checklist,
  };
}

export const countLocalItems = (local: LocalChecklist) => countItems(local.checklist);
