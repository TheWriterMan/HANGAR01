/**
 * generate-aircraft-index.mjs
 *
 * Rebuilds content/aircraft-index.json from the individual checklist files
 * in content/checklists/. Run this any time a checklist JSON is added or
 * its metadata fields (addon, flightsim, simDepth, etc.) are updated.
 *
 * Usage:
 *   node scripts/generate-aircraft-index.mjs
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const clDir = path.join(root, 'content', 'checklists');
const indexPath = path.join(root, 'content', 'aircraft-index.json');

const files = fs.readdirSync(clDir).filter((f) => f.endsWith('.json'));

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

// A shallow clone dates every file by the newest commit it has, so dates come
// only from a full clone (Vercel needs VERCEL_DEEP_CLONE=true). Otherwise the
// field is left out and the page shows no date.
let fullHistory = false;
try {
  fullHistory = git('rev-parse', '--is-shallow-repository') === 'false';
} catch {
  // Not a git checkout.
}

/** YYYY-MM-DD of the checklist's last commit, or today when it has uncommitted changes. */
function lastUpdated(file) {
  if (!fullHistory) return undefined;
  const rel = `content/checklists/${file}`;
  if (git('status', '--porcelain', '--', rel)) return new Date().toISOString().slice(0, 10);
  return git('log', '-1', '--format=%cs', '--', rel) || undefined;
}

const entries = files.map((file) => {
  const data = JSON.parse(fs.readFileSync(path.join(clDir, file), 'utf8'));
  const { checklist, ...meta } = data;

  // Count phases (top-level checklist entries) — must match detail.checklist.length
  const checklistCount = (checklist ?? []).length;

  return { ...meta, checklistCount, lastUpdated: lastUpdated(file) };
});

// Sort: active before coming-soon, then alphabetically by model
entries.sort((a, b) => {
  const statusRank = (v) => (v === 'coming-soon' ? 1 : 0);
  const sd = statusRank(a.status) - statusRank(b.status);
  if (sd !== 0) return sd;
  return a.model.localeCompare(b.model);
});

fs.writeFileSync(indexPath, JSON.stringify(entries, null, 2) + '\n');

console.log(`✓ aircraft-index.json rebuilt — ${entries.length} entries`);
entries.forEach((e) =>
  console.log(
    `  ${e.slug.padEnd(20)} addon=${String(e.addon ?? '—').padEnd(22)} flightsim=${e.flightsim ?? '—'}`,
  ),
);
