#!/usr/bin/env node
/**
 * Research step of the content pipeline.
 *
 * Pulls flight sim news feeds, keeps the recent items, scores them for
 * relevance to HANGAR01 (aircraft we cover, procedures, sim platforms) and
 * writes a digest to research/feed-digest.json. Nothing here publishes;
 * the digest is the input an editor (human or agent) picks topics from.
 *
 * flightsim.to has no public feed and returns 403 to non-browser clients,
 * so it's listed but expected to fail. The other feeds are standard RSS 2.0.
 *
 * Usage: node scripts/fetch-news-feeds.mjs [--days 14]
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const FEEDS = [
  { name: 'flightsim.to', url: 'https://flightsim.to/rss' },
  { name: 'FSElite', url: 'https://fselite.net/feed/' },
  { name: 'Threshold', url: 'https://thresholdx.net/feed' },
  { name: 'simFlight', url: 'https://simflight.com/feed/' },
  { name: 'FSNews', url: 'https://www.fsnews.eu/feed/' },
  { name: 'X-Plane', url: 'https://www.x-plane.com/feed/' },
  { name: 'MSFS Addons', url: 'https://msfsaddons.com/feed/' },
  { name: 'X-Plane.org files', url: 'https://forums.x-plane.org/files/files.xml/' },
  {
    name: 'r/MicrosoftFlightSim',
    url: 'https://www.reddit.com/r/MicrosoftFlightSim/top/.rss?t=week',
  },
  { name: 'FlyByWire', url: 'https://github.com/flybywiresim/aircraft/releases.atom' },
];

const daysArg = process.argv.indexOf('--days');
const MAX_AGE_DAYS = daysArg > -1 ? Number(process.argv[daysArg + 1]) : 14;

// Aircraft we already have checklists for. A story about one of these can
// link straight to a checklist, which is the strongest internal link we have.
const index = JSON.parse(readFileSync(path.resolve('content/aircraft-index.json'), 'utf8'));
// Match on the model name with word boundaries. Addon names are left out
// ("Microsoft" would match every MSFS story). Bare numbers like "172" need
// the manufacturer in front to avoid matching unrelated figures.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const aircraftTerms = index.map((a) => {
  const model = a.model
    .replace(/\s*\/.*$/, '') // "ATR 42/72" -> "ATR 42"
    .replace(/^([A-Z]+\d{3})-\d+$/, '$1'); // "A380-800" -> "A380"
  const terms =
    /^\d+[A-Z]*$/i.test(model) && !/[A-Z]/.test(model.slice(0, 1))
      ? [`${a.manufacturer} ${model}`]
      : [model];
  const suffix = (a.suffix || '').trim();
  if (/^[A-Za-z]{4,}/.test(suffix) && suffix !== 'Combined') terms.push(suffix);
  return { slug: a.slug, patterns: terms.map((t) => new RegExp(`\\b${escape(t)}\\b`, 'i')) };
});

const TOPIC_TERMS = {
  procedure: [
    'checklist',
    'procedure',
    'tutorial',
    'guide',
    'how to',
    'training',
    'cold and dark',
    'startup',
  ],
  platform: ['msfs', 'msfs 2024', 'msfs 2020', 'x-plane', 'xplane', 'prepar3d', 'p3d'],
  release: ['release', 'released', 'now available', 'update', 'patch', 'announced', 'preview'],
};

const decode = (s = '') =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
};

// Handles RSS 2.0 <item> and Atom <entry> (GitHub releases, Reddit).
function parseItems(xml) {
  return [...xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)].map(([item]) => ({
    title: tag(item, 'title'),
    link: tag(item, 'link') || (item.match(/<link[^>]*href="([^"]+)"/i) || [])[1] || '',
    published: tag(item, 'pubDate') || tag(item, 'published') || tag(item, 'updated'),
    categories: [...item.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) =>
      decode(m[1]),
    ),
    summary: (tag(item, 'description') || tag(item, 'summary') || tag(item, 'content')).slice(
      0,
      400,
    ),
  }));
}

function score(item) {
  const text = `${item.title} ${item.summary} ${item.categories.join(' ')}`.toLowerCase();
  const matchedAircraft = aircraftTerms
    .filter((a) => a.patterns.some((p) => p.test(text)))
    .map((a) => a.slug);
  const topics = Object.entries(TOPIC_TERMS)
    .filter(([, terms]) => terms.some((t) => text.includes(t)))
    .map(([k]) => k);
  return {
    score: matchedAircraft.length * 3 + topics.length,
    matchedAircraft,
    topics,
  };
}

async function fetchFeed({ name, url }) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (HANGAR01 feed reader; +https://hangar01.space)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { name, url, ok: false, error: `HTTP ${res.status}`, items: [] };
    return { name, url, ok: true, items: parseItems(await res.text()) };
  } catch (err) {
    return { name, url, ok: false, error: err.message, items: [] };
  }
}

const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
const results = await Promise.all(FEEDS.map(fetchFeed));

const items = results
  .flatMap((r) => r.items.map((i) => ({ source: r.name, ...i, ...score(i) })))
  .filter((i) => !i.published || new Date(i.published).getTime() >= cutoff)
  .sort((a, b) => b.score - a.score || new Date(b.published) - new Date(a.published));

const digest = {
  fetchedAt: new Date().toISOString(),
  maxAgeDays: MAX_AGE_DAYS,
  sources: results.map(({ name, url, ok, error, items: i }) => ({
    name,
    url,
    ok,
    error,
    count: i.length,
  })),
  items,
};

await mkdir('research', { recursive: true });
await writeFile('research/feed-digest.json', JSON.stringify(digest, null, 2));

for (const s of digest.sources)
  console.log(
    `${s.ok ? 'ok  ' : 'fail'} ${s.name.padEnd(21)} ${s.ok ? `${s.count} items` : s.error}`,
  );
console.log(`\n${items.length} items in the last ${MAX_AGE_DAYS} days. Top 15:\n`);
for (const i of items.slice(0, 15)) {
  const tags = [...i.matchedAircraft.map((a) => `@${a}`), ...i.topics].join(' ');
  console.log(`[${i.score}] ${i.source}: ${i.title}${tags ? `  (${tags})` : ''}`);
}
