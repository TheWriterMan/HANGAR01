export interface ChangelogEntry {
  heading: string;
  /** YYYY-MM-DD the release reached main, from the heading's trailing " — Month DD, YYYY". */
  date?: string;
  sections: { title: string; items: string[] }[];
}

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

/** "v1.1.0 — Title — November 4, 2026" → heading "v1.1.0 — Title", date "2026-11-04". */
export function splitDate(line: string): { heading: string; date?: string } {
  const match = line.match(/^(.*?)\s+[—-]\s+([A-Za-z]+) (\d{1,2}), (\d{4})$/);
  const month = match ? MONTHS.indexOf(match[2].toLowerCase()) : -1;
  if (!match || month < 0) return { heading: line };
  const pad = (n: number) => String(n).padStart(2, '0');
  return { heading: match[1], date: `${match[4]}-${pad(month + 1)}-${pad(Number(match[3]))}` };
}

export function parseChangelog(raw: string): ChangelogEntry[] {
  // Strip HTML comments (rules/meta block)
  const stripped = raw.replace(/<!--[\s\S]*?-->/g, '');
  const entries: ChangelogEntry[] = [];
  const parts = stripped.split(/^## /m).slice(1);

  for (const part of parts) {
    const lines = part.split('\n');
    const { heading, date } = splitDate(lines[0].trim());
    if (!heading) continue;

    const sections: { title: string; items: string[] }[] = [];
    let currentSection: { title: string; items: string[] } | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('### ')) {
        currentSection = { title: line.replace('### ', '').trim(), items: [] };
        sections.push(currentSection);
      } else if (line.startsWith('- ') && currentSection) {
        currentSection.items.push(line.replace(/^- /, '').trim());
      }
    }

    if (sections.length > 0) entries.push({ heading, date, sections });
  }

  return entries;
}

export function sectionColor(title: string): string {
  switch (title.toLowerCase()) {
    case 'added':
      return 'text-success';
    case 'fixed':
      return 'text-warning';
    case 'changed':
      return 'text-accent';
    case 'removed':
      return 'text-danger';
    default:
      return 'text-muted';
  }
}
