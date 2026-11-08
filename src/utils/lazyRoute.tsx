import React, { lazy } from 'react';

type Loader = () => Promise<{ default: React.ComponentType }>;

export interface LazyRoute extends React.FC {
  /** Loads the chunk. Afterwards the route renders without suspending. */
  preload: () => Promise<void>;
}

/**
 * A page in its own chunk. Client-side navigation suspends while the chunk
 * loads. Preloading it first (entry-client, entry-server) makes it render
 * synchronously, so hydrating a prerendered page never falls back to a spinner.
 */
export function lazyRoute(load: Loader): LazyRoute {
  let loaded: React.ComponentType | null = null;
  const loadAndKeep = () =>
    load().then((module) => {
      loaded = module.default;
      return module;
    });
  const Lazy = lazy(loadAndKeep);

  const Route: React.FC = () => {
    const Page = loaded;
    return Page ? <Page /> : <Lazy />;
  };
  return Object.assign(Route, { preload: () => loadAndKeep().then(() => undefined) });
}
