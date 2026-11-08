import React, { Suspense } from 'react';
import { Routes, Route, matchRoutes, useParams } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Home from './pages/Home/Home';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import RouteAnnouncer from './components/layout/RouteAnnouncer';
import PageLoadingState from './components/ui/PageLoadingState';
import { lazyRoute, LazyRoute } from './utils/lazyRoute';

// Home ships in the main bundle; every other page is its own chunk.
const ChecklistPage = lazyRoute(() => import('./pages/Checklist/ChecklistPage'));
const BlogPostPage = lazyRoute(() => import('./pages/BlogPost/BlogPostPage'));
const NotamsPage = lazyRoute(() => import('./pages/Notams/NotamsPage'));
const ContactPage = lazyRoute(() => import('./pages/Contact/ContactPage'));
const AircraftsPage = lazyRoute(() => import('./pages/Aircrafts/AircraftsPage'));
const ChangelogPage = lazyRoute(() => import('./pages/Changelog/ChangelogPage'));
const AboutPage = lazyRoute(() => import('./pages/About/AboutPage'));
const PrivacyPage = lazyRoute(() => import('./pages/Privacy/PrivacyPage'));
/** Remount the checklist per aircraft so no state carries over between slugs. */
const KeyedChecklistPage: React.FC = () => {
  const { id } = useParams();
  return <ChecklistPage key={id} />;
};

interface AppRoute {
  path: string;
  element: React.ReactNode;
  /** The lazy page behind the route, if any. */
  page?: LazyRoute;
}

const ROUTES: AppRoute[] = [
  { path: '/', element: <Home /> },
  { path: '/aircraft', element: <AircraftsPage />, page: AircraftsPage },
  { path: '/news', element: <NotamsPage />, page: NotamsPage },
  { path: '/contact', element: <ContactPage />, page: ContactPage },
  { path: '/changelog', element: <ChangelogPage />, page: ChangelogPage },
  { path: '/about', element: <AboutPage />, page: AboutPage },
  { path: '/privacy', element: <PrivacyPage />, page: PrivacyPage },
  { path: '/aircraft/:id', element: <KeyedChecklistPage />, page: ChecklistPage },
  { path: '/news/:id', element: <BlogPostPage />, page: BlogPostPage },
  { path: '*', element: <NotFoundPage /> },
];

/** Loads the chunk for the page at `pathname`, so it can hydrate without suspending. */
export async function preloadRoute(pathname: string): Promise<void> {
  await matchRoutes(ROUTES, pathname)?.[0]?.route.page?.preload();
}

/** Loads every page chunk. The prerender renders each page in full. */
export async function preloadAllRoutes(): Promise<void> {
  await Promise.all(ROUTES.map((route) => route.page?.preload()));
}

/** The app shell and routes. The router comes from entry-client or entry-server. */
const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollToTop />
      <RouteAnnouncer />
      <div className="min-h-screen bg-base text-primary font-sans flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-skip focus:bg-accent focus:text-inverted focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        {/* Announcement is now part of Header mega menu component */}
        <Header />
        <main id="main-content" className="flex-1 relative flex flex-col">
          <Suspense fallback={<PageLoadingState variant="fullPage" className="text-muted" />}>
            <Routes>
              {ROUTES.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
};

export default App;
