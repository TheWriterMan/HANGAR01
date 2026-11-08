/**
 * indexnow.mjs
 *
 * Tells IndexNow (Bing, Yandex, Seznam and others) which pages changed between
 * two commits, so new posts and checklist fixes are recrawled within hours.
 * Run by ci.yml once a production deploy is live. The key file is
 * public/<key>.txt.
 *
 * Usage:
 *   node scripts/indexnow.mjs <base-sha> <head-sha>
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const HOST = 'www.hangar01.space';
const KEY = 'abb6274a28a3d03a7d8006bd8fa7e715';

const [base, head] = process.argv.slice(2);
if (!base || !head || /^0+$/.test(base)) {
  console.log('No base commit to compare against; skipping IndexNow.');
  process.exit(0);
}

const changed = execFileSync('git', ['diff', '--name-only', base, head], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

const paths = new Set();
for (const file of changed) {
  const checklist = file.match(/^content\/checklists\/([a-z0-9-]+)\.json$/);
  if (checklist) {
    paths.add(`/aircraft/${checklist[1]}`).add('/aircraft').add('/');
    continue;
  }
  if (/^content\/posts\/.+\.md$/.test(file) && fs.existsSync(path.join(root, file))) {
    const md = fs.readFileSync(path.join(root, file), 'utf8');
    const slug = md.match(/^slug:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1];
    // Drafts aren't published, so there is nothing to recrawl.
    if (slug && !/^status:\s*["']?draft/m.test(md))
      paths.add(`/news/${slug}`).add('/news').add('/');
  }
}

if (paths.size === 0) {
  console.log('No content pages changed; skipping IndexNow.');
  process.exit(0);
}

const urlList = [...paths].map((p) => `https://${HOST}${p}`);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  }),
});

// 200 and 202 both mean accepted.
if (!res.ok) {
  console.error(`✗ IndexNow returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}
console.log(`✓ IndexNow notified of ${urlList.length} URLs:\n  ${urlList.join('\n  ')}`);
