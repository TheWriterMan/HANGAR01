import type { Aircraft, ChecklistPhase } from '../types';
import { countItems } from './checklist';
import { LOCAL_CHECKLIST_LIMIT } from './checklistCsv';
import { collectItemKeys, loadProgress, modeKey, progressKey, saveProgress } from './progress';
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

/** Errors that mean this browser won't give the site IndexedDB at all (storage disabled, old private modes). */
const UNAVAILABLE = new Set(['SecurityError', 'InvalidStateError', 'NotSupportedError']);
/** How long to wait when another tab's open connection blocks ours. */
const BLOCKED_TIMEOUT_MS = 3_000;

/**
 * Opens the database. A failure other than "IndexedDB is unavailable" is retried on
 * the next call, so one error never moves the whole tab to memory.
 */
function openDb(): Promise<IDBDatabase | null> {
  if (inMemory) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  const attempt = new Promise<IDBDatabase | null>((resolve) => {
    if (typeof indexedDB === 'undefined') {
      inMemory = true;
      return resolve(null);
    }
    let settled = false;
    const finish = (db: IDBDatabase | null) => {
      if (settled) {
        db?.close();
        return;
      }
      settled = true;
      resolve(db);
    };
    const open = (version?: number) => {
      let request: IDBOpenDBRequest;
      try {
        request = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME);
      } catch {
        inMemory = true;
        return finish(null);
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.close();
          return finish(null);
        }
        // A later version opened in another tab: step aside, reopen on next use.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        finish(db);
      };
      request.onerror = (event) => {
        const name = request.error?.name;
        // The database is at a higher version than this code asks for (a newer
        // deploy in another tab): open it at whatever version it has.
        if (name === 'VersionError' && version) {
          event.preventDefault();
          return open();
        }
        if (name && UNAVAILABLE.has(name)) inMemory = true;
        finish(null);
      };
      // Another tab holds an older connection open, so this open waits. Give up for
      // now; the next call tries again.
      request.onblocked = () => setTimeout(() => finish(null), BLOCKED_TIMEOUT_MS);
    };
    open(1);
  });
  dbPromise = attempt.then((db) => {
    if (!db) dbPromise = null;
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
    id: newId(),
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

export type UpdateResult =
  | { ok: true; checklist: LocalChecklist }
  /** `missing`: deleted, in another tab perhaps. `storage`: the write failed. */
  | { ok: false; reason: 'missing' | 'storage' };

/** Writes a changed record (rename, replace). */
async function updateLocalChecklist(
  id: string,
  change: (record: LocalChecklist) => LocalChecklist,
  now: Date,
): Promise<UpdateResult> {
  const current = await getLocalChecklist(id);
  if (!current) return { ok: false, reason: 'missing' };
  const next = { ...change(current), id, updatedAt: now.toISOString() };
  if (inMemory) {
    memory.set(id, next);
    return { ok: true, checklist: next };
  }
  const result = await run('readwrite', (store) => store.put(next));
  return result.ok ? { ok: true, checklist: next } : { ok: false, reason: 'storage' };
}

export async function renameLocalChecklist(
  id: string,
  name: string,
  now = new Date(),
): Promise<UpdateResult> {
  return updateLocalChecklist(id, (record) => ({ ...record, meta: { ...record.meta, name } }), now);
}

/**
 * The ticks a replace keeps: those whose item still exists under the same phase id
 * and whose phase kept its title. Phase ids come from titles, and titles with no
 * latin letters all become `item`, `item-2`…, so reordering or deleting such phases
 * hands an id to another phase; the title check stops a tick moving onto it.
 */
export function ticksAfterReplace(
  checked: string[],
  before: ChecklistPhase[],
  after: ChecklistPhase[],
): string[] {
  const titleBefore = new Map(before.map((phase) => [phase.id, phase.title]));
  const titleAfter = new Map(after.map((phase) => [phase.id, phase.title]));
  const exists = collectItemKeys(after);
  return checked.filter((key) => {
    const phaseId = key.slice(0, key.indexOf('/'));
    return (
      exists.has(key) &&
      titleBefore.has(phaseId) &&
      titleBefore.get(phaseId) === titleAfter.get(phaseId)
    );
  });
}

/** Swaps in the items of a new CSV, keeping the ticks `ticksAfterReplace` allows. */
export async function replaceLocalChecklistItems(
  id: string,
  checklist: ChecklistPhase[],
  now = new Date(),
): Promise<UpdateResult> {
  let before: ChecklistPhase[] = [];
  const result = await updateLocalChecklist(
    id,
    (record) => {
      before = record.checklist;
      return { ...record, checklist };
    },
    now,
  );
  if (result.ok) {
    saveProgress(id, ticksAfterReplace(loadProgress(id, before), before, checklist), now);
  }
  return result;
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

/** A random v4 UUID. `crypto.randomUUID` is missing outside secure contexts and in older browsers. */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
