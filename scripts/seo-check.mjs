/**
 * seo-check.mjs
 *
 * Reads the prerendered pages in dist/ and fails when an indexable page has:
 *   - a missing or duplicate title or description (on the page or across pages)
 *   - a title over 60 characters or a description over 160
 *   - anything other than exactly one <h1>
 *   - no canonical, or a canonical that differs from its URL
 * Pages marked noindex (404, design pages, draft checklists) are skipped.
 * Every page, noindex included, also fails on an inline script the CSP would
 * block (React's streaming reveal scripts, for one, which leave content hidden).
 *
 * Usage:
 *   npm run build && npm run seo:check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '..', 'dist');
const BASE_URL = 'https://www.hangar01.space';

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

/** The URL Vercel serves a file at (cleanUrls, no trailing slash). */
function urlFor(file) {
  const rel = path
    .relative(dist, file)
    .split(path.sep)
    .join('/')
    .replace(/\.html$/, '');
  return rel === 'index' ? `${BASE_URL}/` : `${BASE_URL}/${rel}`;
}

const errors = [];
const titles = new Map();
const descriptions = new Map();
let checked = 0;

// Scripts with no src and a type the browser executes. JSON data blocks are fine.
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)(?![^>]*type="application\/(?:ld\+)?json")[^>]*>/;

for (const file of htmlFiles(dist)) {
  const html = fs.readFileSync(file, 'utf8');
  if (INLINE_SCRIPT.test(html))
    errors.push(`${path.relative(dist, file)}: inline <script> blocked by the CSP`);
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) continue;

  const url = urlFor(file);
  const fail = (msg) => errors.push(`${url}: ${msg}`);
  checked++;

  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '');
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;

  // React 19 doesn't dedupe Helmet tags, so two <SEO> on one page ship twice.
  for (const [tag, re] of [
    ['title', /<title>/g],
    ['description', /<meta name="description"/g],
    ['canonical', /<link rel="canonical"/g],
  ]) {
    const n = (html.match(re) ?? []).length;
    if (n > 1) fail(`has ${n} ${tag} tags`);
  }

  if (!title) fail('missing title');
  else if (title.length > 60) fail(`title is ${title.length} characters (max 60): "${title}"`);
  if (!description) fail('missing description');
  else if (description.length > 160)
    fail(`description is ${description.length} characters (max 160)`);
  if (h1Count !== 1) fail(`has ${h1Count} <h1> elements (expected 1)`);
  if (!canonical) fail('missing canonical');
  else if (canonical !== url) fail(`canonical is ${canonical}`);

  if (title) titles.set(title, [...(titles.get(title) ?? []), url]);
  if (description) descriptions.set(description, [...(descriptions.get(description) ?? []), url]);
}

for (const [title, urls] of titles) {
  if (urls.length > 1) errors.push(`duplicate title "${title}": ${urls.join(', ')}`);
}
for (const [description, urls] of descriptions) {
  if (urls.length > 1) errors.push(`duplicate description "${description}": ${urls.join(', ')}`);
}

if (errors.length) {
  console.error(`✗ SEO check failed (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ SEO check passed for ${checked} pages`);
