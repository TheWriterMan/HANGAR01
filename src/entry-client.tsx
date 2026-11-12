import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import App, { preloadRoute } from './App';
import { InitialChecklistContext, readEmbeddedChecklist } from './services/initialChecklist';
import { applyCountSwitch } from './utils/events';

inject();
injectSpeedInsights();
// ?count=off stops this browser's usage events, ?count=on starts them again.
applyCountSwitch();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <InitialChecklistContext.Provider value={readEmbeddedChecklist()}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </InitialChecklistContext.Provider>
    </HelmetProvider>
  </React.StrictMode>
);

// Prerendered pages ship their HTML, so hydrate it. The dev server serves an
// empty root, so render from scratch there. 404.html is served at whatever URL
// was missing, so its HTML can't match this URL's render; replace it instead.
if (rootElement.hasChildNodes() && !rootElement.hasAttribute('data-not-found')) {
  // Load this page's chunk first, so hydration renders it instead of suspending.
  preloadRoute(window.location.pathname).then(() => ReactDOM.hydrateRoot(rootElement, app));
} else {
  // A fresh render adds its own page tags, so drop the prerendered ones (all
  // from Helmet; index.html has none of these).
  document.head
    .querySelectorAll(
      'title, meta[name="description"], meta[name="robots"], meta[property], meta[name^="twitter:"], link[rel="canonical"]',
    )
    .forEach((el) => el.remove());
  ReactDOM.createRoot(rootElement).render(app);
}
