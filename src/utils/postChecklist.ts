import { ChecklistItem } from '../types';

const kebab = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Parses the body of a `:::checklist` block. One item per line:
 * `Label | ACTION` or `Label | ACTION | info text`. Blank lines are skipped.
 * IDs include the line index so repeated labels (e.g. two "Flaps" rows) stay unique.
 */
export function parseChecklistLines(lines: string[]): ChecklistItem[] {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [label = '', action = '', ...info] = line.split('|').map((p) => p.trim());
      return {
        id: `${i}-${kebab(label)}`,
        label,
        action,
        info: info.join(' | ') || undefined,
      };
    });
}
