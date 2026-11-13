import type { ChecklistItem, ChecklistPhase, ChecklistTier } from '../types';
import { ID_PATTERN, toKebabId, uniqueId } from './ids';

/**
 * My Hangar's CSV import: spreadsheet rows → the same ChecklistPhase tree the
 * built-in checklists use, so ChecklistView renders it unchanged.
 *
 * One row per item, header row required, column names case-insensitive.
 * Required: phase, label, action. Optional: group, tier, info, id.
 * Errors block the import; warnings don't. Row numbers are spreadsheet rows
 * (the header is row 1), so a cell with a line break still counts as one row.
 *
 * Parsing is Papa Parse's job (loaded on the import screen only). This module
 * takes its output, so it stays pure and testable.
 */

/** The sample file in public/, linked from the home page and /hangar. */
export const SAMPLE_CSV_URL = '/samples/hangar01-sample-checklist.csv';

export const CSV_LIMITS = {
  fileBytes: 500 * 1024,
  rows: 1000,
  label: 120,
  action: 120,
  info: 500,
} as const;

/** How many checklists My Hangar holds. */
export const LOCAL_CHECKLIST_LIMIT = 50;

export const CSV_COLUMNS = ['phase', 'group', 'label', 'action', 'tier', 'info', 'id'] as const;
type Column = (typeof CSV_COLUMNS)[number];
const REQUIRED: Column[] = ['phase', 'label', 'action'];
const TIERS: ChecklistTier[] = ['quick', 'normal', 'full'];

export interface CsvIssue {
  /** Spreadsheet row (header = 1), or null for the whole file. */
  row: number | null;
  message: string;
}

export interface CsvConversion {
  checklist: ChecklistPhase[];
  itemCount: number;
  groupCount: number;
  errors: CsvIssue[];
  warnings: CsvIssue[];
}

const formatCount = (n: number) => n.toLocaleString('en-GB');

const isBlank = (row: string[]) => row.every((cell) => cell.trim() === '');

interface PendingItem {
  row: number;
  label: string;
  action: string;
  tier: ChecklistTier;
  info: string;
  /** The id cell as written, or '' to generate one from the label. */
  id: string;
}

interface PendingPhase {
  title: string;
  groups: Map<string, PendingItem[]>;
}

/** Converts parsed rows (header first) to a checklist, with every problem found. */
export function convertCsvRows(rows: string[][]): CsvConversion {
  const errors: CsvIssue[] = [];
  const warnings: CsvIssue[] = [];
  const fail = (issue: CsvIssue): CsvConversion => ({
    checklist: [],
    itemCount: 0,
    groupCount: 0,
    errors: [...errors, issue],
    warnings,
  });

  // Trailing blank rows are what spreadsheets and a final newline leave behind.
  let end = rows.length;
  while (end > 0 && isBlank(rows[end - 1])) end--;
  if (end === 0) return fail({ row: null, message: 'The file is empty.' });

  // ─── Header ───────────────────────────────────────────────────────────────
  const columns = new Map<Column, number>();
  rows[0].forEach((cell, index) => {
    const name = cell.trim().toLowerCase();
    if (!name) return;
    if (!(CSV_COLUMNS as readonly string[]).includes(name)) {
      warnings.push({ row: 1, message: `Unknown column "${cell.trim()}" is ignored.` });
    } else if (columns.has(name as Column)) {
      warnings.push({
        row: 1,
        message: `The column "${name}" appears twice. Only the first one is used.`,
      });
    } else {
      columns.set(name as Column, index);
    }
  });
  const missing = REQUIRED.filter((name) => !columns.has(name));
  if (missing.length > 0) {
    for (const name of missing) {
      errors.push({ row: 1, message: `The required column "${name}" is missing.` });
    }
    return { checklist: [], itemCount: 0, groupCount: 0, errors, warnings };
  }

  const itemRows = rows.slice(1, end).filter((row) => !isBlank(row)).length;
  if (itemRows === 0) return fail({ row: null, message: 'The file has no checklist rows.' });
  if (itemRows > CSV_LIMITS.rows) {
    return fail({
      row: null,
      message: `The file has ${formatCount(itemRows)} rows. The limit is ${formatCount(CSV_LIMITS.rows)}.`,
    });
  }

  // ─── Rows ─────────────────────────────────────────────────────────────────
  const phases = new Map<string, PendingPhase>();
  let previousPhase: string | null = null;

  for (let index = 1; index < end; index++) {
    const cells = rows[index];
    const row = index + 1;
    if (isBlank(cells)) {
      warnings.push({ row, message: 'Blank row skipped.' });
      continue;
    }
    const get = (name: Column) => {
      const at = columns.get(name);
      return at === undefined ? '' : (cells[at] ?? '').trim();
    };

    const phase = get('phase');
    const label = get('label');
    const action = get('action');
    const info = get('info');
    const before = errors.length;
    if (!phase) errors.push({ row, message: 'Phase is empty.' });
    if (!label) errors.push({ row, message: 'Label is empty.' });
    if (!action) errors.push({ row, message: 'Action is empty.' });
    if (label.length > CSV_LIMITS.label) {
      errors.push({ row, message: `Label is over ${CSV_LIMITS.label} characters.` });
    }
    if (action.length > CSV_LIMITS.action) {
      errors.push({ row, message: `Action is over ${CSV_LIMITS.action} characters.` });
    }
    if (info.length > CSV_LIMITS.info) {
      errors.push({ row, message: `Info is over ${CSV_LIMITS.info} characters.` });
    }
    if (errors.length > before) continue;

    const tierCell = get('tier');
    let tier: ChecklistTier = 'quick';
    if (tierCell) {
      const lower = tierCell.toLowerCase();
      if ((TIERS as string[]).includes(lower)) tier = lower as ChecklistTier;
      else {
        warnings.push({
          row,
          message: `Tier "${tierCell}" isn't quick, normal or full, so it's set to quick.`,
        });
      }
    }

    let pending = phases.get(phase);
    if (!pending) {
      pending = { title: phase, groups: new Map() };
      phases.set(phase, pending);
    } else if (previousPhase !== phase) {
      warnings.push({
        row,
        message: `Phase "${phase}" also appears earlier. This row and the ones after it join it there.`,
      });
    }
    previousPhase = phase;

    const group = get('group') || phase;
    const items = pending.groups.get(group) ?? [];
    items.push({ row, label, action, tier, info, id: get('id') });
    pending.groups.set(group, items);
  }

  // ─── Ids ──────────────────────────────────────────────────────────────────
  // Same rules as the built-in checklists (src/utils/ids.ts): kebab-case, unique
  // within the phase, later duplicates suffixed -2, -3. Ids written in the file
  // are placed first, so a label elsewhere can never push one aside.
  const phaseIds = new Set<string>();
  const checklist: ChecklistPhase[] = [];
  let itemCount = 0;
  let groupCount = 0;

  for (const pending of phases.values()) {
    const phaseId = uniqueId(toKebabId(pending.title), phaseIds);
    phaseIds.add(phaseId);
    const all = [...pending.groups.values()].flat();
    const ids = new Map<PendingItem, string>();
    const taken = new Set<string>();

    for (const item of all) {
      if (!item.id) continue;
      let id = item.id;
      if (!ID_PATTERN.test(id)) {
        id = toKebabId(id);
        warnings.push({
          row: item.row,
          message: `Id "${item.id}" isn't kebab-case, so it's "${id}".`,
        });
      }
      if (taken.has(id)) {
        const next = uniqueId(id, taken);
        warnings.push({
          row: item.row,
          message: `Id "${id}" is already used in this phase, so it's "${next}".`,
        });
        id = next;
      }
      taken.add(id);
      ids.set(item, id);
    }
    for (const item of all) {
      if (ids.has(item)) continue;
      const id = uniqueId(toKebabId(item.label), taken);
      taken.add(id);
      ids.set(item, id);
    }

    checklist.push({
      id: phaseId,
      title: pending.title,
      groups: [...pending.groups.entries()].map(([title, items]) => ({
        title,
        items: items.map((item): ChecklistItem => {
          const out: ChecklistItem = {
            id: ids.get(item)!,
            label: item.label,
            action: item.action,
            tier: item.tier,
          };
          if (item.info) out.info = item.info;
          return out;
        }),
      })),
    });
    itemCount += all.length;
    groupCount += pending.groups.size;
  }

  warnings.sort((a, b) => (a.row ?? 0) - (b.row ?? 0));
  return { checklist, itemCount, groupCount, errors, warnings };
}

/** The part of Papa Parse this module uses, so tests can pass the real one. */
export interface CsvParser {
  parse(
    input: string,
    config: { skipEmptyLines: false },
  ): { data: unknown[]; errors: { type: string; row?: number }[] };
}

/** Size check, parse and convert. `text` is the whole file or the pasted cells. */
export function parseChecklistCsv(text: string, parser: CsvParser): CsvConversion {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > CSV_LIMITS.fileBytes) {
    return {
      checklist: [],
      itemCount: 0,
      groupCount: 0,
      errors: [{ row: null, message: 'The file is over 500 KB.' }],
      warnings: [],
    };
  }
  const result = parser.parse(text, { skipEmptyLines: false });
  const rows = result.data.map((row) =>
    Array.isArray(row) ? row.map((cell) => String(cell ?? '')) : [],
  );
  const conversion = convertCsvRows(rows);
  const quoteErrors: CsvIssue[] = result.errors
    .filter((e) => e.type === 'Quotes')
    .map((e) => ({
      row: typeof e.row === 'number' ? e.row + 1 : null,
      message: "A quote mark isn't closed, so the rows after it run together.",
    }));
  if (quoteErrors.length === 0) return conversion;
  return { ...conversion, errors: [...quoteErrors, ...conversion.errors] };
}

/** "My C172 checklist.csv" → "My C172 checklist". */
export function nameFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_]+/g, ' ')
    .trim();
}
