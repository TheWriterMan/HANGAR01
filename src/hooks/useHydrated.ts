import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False in the prerender and during hydration, true afterwards (and on every
 * client-side render). Gate anything that reads the browser (localStorage, the
 * query string) behind it so the first client render matches the static HTML.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
