/**
 * prerender.mjs
 *
 * Runs after `vite build` and the SSR build (see the `build` script). Renders
 * every route to static HTML in dist/ so crawlers get real pages, and the
 * client hydrates them (src/entry-client.tsx). Also writes 404.html,
 * sitemap.xml, robots.txt and the news feed (news/rss.xml).
 *
 * Usage:
 *   npm run build
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

// Load React's production server build.
process.env.NODE_ENV = 'production';

const { render, getRoutes, getFeedPosts } = await import(
  pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href
);

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
// dist/index.html becomes the prerendered home page, so a second run would
// render into it. Rebuild instead.
if (!template.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html is already prerendered. Run `npm run build`.');
}

// React 19 emits hoistable tags (<title>, <meta>, <link>) from Helmet at the
// start of the output. Move them into <head>; the client reuses them there.
const HEAD_TAG = /^(?:<title>[\s\S]*?<\/title>|<meta [^>]*\/>|<link [^>]*\/>)/;

function splitHead(html) {
  let head = '';
  let rest = html;
  let match;
  while ((match = rest.match(HEAD_TAG))) {
    head += match[0];
    rest = rest.slice(match[0].length);
  }
  return { head, body: rest };
}

/** JSON that is safe inside a <script> element. */
const scriptJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

function readChecklist(slug) {
  return JSON.parse(
    fs.readFileSync(path.join(root, 'content', 'checklists', `${slug}.json`), 'utf8'),
  );
}

async function renderPage(route, checklist = null, rootAttrs = '') {
  const { head, body } = splitHead(await render(route, checklist));
  const data = checklist
    ? `<script type="application/json" id="checklist-data">${scriptJson(checklist)}</script>`
    : '';
  return template
    .replace('</head>', `${head}</head>`)
    .replace('<div id="root"></div>', `<div id="root"${rootAttrs}>${body}</div>${data}`);
}

function write(file, contents) {
  const out = path.join(dist, file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, contents);
}

const routeFile = (route) => (route === '/' ? 'index.html' : `${route.slice(1)}.html`);

/**
 * A shallow clone (CI, Vercel without VERCEL_DEEP_CLONE) dates every file by
 * its newest commit, so git dates are only used with full history.
 */
let fullHistory = false;
try {
  fullHistory =
    execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd: root,
      encoding: 'utf8',
    }).trim() === 'false';
} catch {
  // Not a git checkout.
}

/** Date of the last commit touching any of the paths, or null without full git history. */
function lastModified(paths) {
  if (!fullHistory) return null;
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...paths], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
    return date || null;
  } catch {
    return null;
  }
}

/** A post's markdown file, found by its frontmatter slug. */
function postFile(slug) {
  const dir = path.join(root, 'content', 'posts');
  const slugLine = new RegExp(`^slug:\\s*["']?${slug}["']?\\s*$`, 'm');
  const file = fs
    .readdirSync(dir)
    .find((f) => slugLine.test(fs.readFileSync(path.join(dir, f), 'utf8')));
  return file ? `content/posts/${file}` : 'content/posts';
}

// Sources whose last commit dates each static page in the sitemap.
const PAGE_SOURCES = {
  '/': ['src/pages/Home', 'content/posts', 'content/checklists'],
  '/aircraft': ['src/pages/Aircrafts', 'content/checklists'],
  '/news': ['src/pages/Notams', 'content/posts'],
  '/contact': ['src/pages/Contact'],
  '/changelog': ['CHANGELOG.md'],
  '/about': ['src/pages/About'],
  '/privacy': ['src/pages/Privacy'],
};

const routes = getRoutes();
/** Indexable routes for the sitemap, as [route, source paths or a known date]. */
const sitemap = [];
let count = 0;

for (const route of routes.pages) {
  write(routeFile(route), await renderPage(route));
  if (PAGE_SOURCES[route]) sitemap.push([route, PAGE_SOURCES[route]]);
  count++;
}

for (const { slug, status, lastUpdated } of routes.aircraft) {
  const route = `/aircraft/${slug}`;
  write(routeFile(route), await renderPage(route, readChecklist(slug)));
  // Drafts are prerendered with noindex and left out of the sitemap. The
  // aircraft index already holds each checklist's git date.
  if (status !== 'draft') sitemap.push([route, lastUpdated ?? null]);
  count++;
}

for (const { slug, status } of routes.posts) {
  const route = `/news/${slug}`;
  write(routeFile(route), await renderPage(route));
  if (status !== 'draft') sitemap.push([route, [postFile(slug)]]);
  count++;
}

// Vercel serves 404.html with a 404 status for any path without a file.
write('404.html', await renderPage('/404', null, ' data-not-found'));
count++;

const urls = sitemap.map(([route, sources]) => {
  const lastmod = Array.isArray(sources) ? lastModified(sources) : sources;
  return `  <url><loc>${routes.baseUrl}${route}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
});
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
);

// AI crawlers (GPTBot, ClaudeBot, PerplexityBot and the rest) fall under * and are allowed.
write(
  'robots.txt',
  `User-agent: *\nAllow: /\nDisallow: /api\n\nSitemap: ${routes.baseUrl}/sitemap.xml\n`,
);

// RSS 2.0 feed of published posts, linked from every page's <head>.
const xml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const feedPosts = getFeedPosts();
const items = feedPosts.map((p) => {
  const link = `${routes.baseUrl}/news/${p.slug}`;
  return [
    '    <item>',
    `      <title>${xml(p.title)}</title>`,
    `      <link>${link}</link>`,
    `      <guid isPermaLink="true">${link}</guid>`,
    `      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>`,
    `      <category>${xml(p.category)}</category>`,
    `      <description>${xml(p.description)}</description>`,
    '    </item>',
  ].join('\n');
});
const lastBuild = feedPosts[0]
  ? new Date(feedPosts[0].publishedAt).toUTCString()
  : new Date(0).toUTCString();
write(
  'news/rss.xml',
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>HANGAR01 News</title>',
    `    <link>${routes.baseUrl}/news</link>`,
    '    <description>Flight sim news and add-on updates from HANGAR01.</description>',
    '    <language>en</language>',
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    `    <atom:link href="${routes.baseUrl}/news/rss.xml" rel="self" type="application/rss+xml"/>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n'),
);

console.log(
  `✓ prerendered ${count} pages, sitemap with ${sitemap.length} URLs, feed with ${feedPosts.length} posts`,
);
