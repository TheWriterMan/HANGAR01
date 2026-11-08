import React from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App, { preloadAllRoutes } from './App';
import { InitialChecklistContext } from './services/initialChecklist';
import { getAircraftList } from './services/aircraft';
import { getAllPosts } from './utils/posts';
import { BASE_URL } from './components/seo/SEO';
import { Aircraft } from './types';

/** Renders one route to HTML for scripts/prerender.mjs. */
export async function render(url: string, checklist: Aircraft | null = null): Promise<string> {
  // Lazy pages render synchronously once loaded, matching the client's hydration.
  await preloadAllRoutes();
  const { prelude } = await prerenderToNodeStream(
    <React.StrictMode>
      <HelmetProvider>
        <InitialChecklistContext.Provider value={checklist}>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </InitialChecklistContext.Provider>
      </HelmetProvider>
    </React.StrictMode>,
    // React moves a Suspense boundary over 12.8 kB out of place and reveals it with an
    // inline script, which the CSP blocks. A static page has no reason to stream, so
    // keep every boundary in place.
    { progressiveChunkSize: Number.POSITIVE_INFINITY },
  );
  let html = '';
  for await (const chunk of prelude) html += chunk;
  return html;
}

/** Every public route. Drafts are only in the bundle on dev previews, and stay out of the sitemap and feed. */
export function getRoutes() {
  return {
    baseUrl: BASE_URL,
    pages: ['/', '/aircraft', '/news', '/contact', '/changelog', '/about', '/privacy'],
    aircraft: getAircraftList().map((ac) => ({
      slug: ac.slug,
      status: ac.status,
      lastUpdated: ac.lastUpdated,
    })),
    posts: getAllPosts().map((p) => ({ slug: p.slug.current, status: p.status })),
  };
}

/** Published posts for the RSS feed, newest first. */
export function getFeedPosts() {
  return getAllPosts()
    .filter((p) => p.status !== 'draft')
    .map((p) => ({
      slug: p.slug.current,
      title: p.title,
      publishedAt: p.publishedAt,
      category: p.category,
      description: p.description || p.excerpt,
    }));
}
