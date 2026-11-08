/**
 * Checklist id rules, shared by the checklist data, progress storage and
 * (later) CSV import. See docs/checklist-guide.md#ids.
 *
 * An id is lowercase kebab-case and unique within its phase. Once published it
 * is permanent: editing the label does not change it.
 */

export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Used when a label has no latin letters or digits at all (e.g. "°"). */
const FALLBACK_ID = 'item';

/** "Bat & Alt Master" → "bat-alt-master", "Café 2" → "cafe-2". */
export function toKebabId(text: string): string {
  const id = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents left by NFKD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return id || FALLBACK_ID;
}

/**
 * Returns `base`, or the first of `base-2`, `base-3`, … not in `taken`.
 * Does not add the result to `taken`.
 */
export function uniqueId(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
