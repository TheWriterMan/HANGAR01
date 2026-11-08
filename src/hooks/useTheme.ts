import { useCallback, useSyncExternalStore } from 'react';
import { readStorage, writeStorage } from '../utils/storage';

export type Theme = 'dark' | 'light';

/** Keep in sync with public/theme-init.js, which applies the theme before first paint. */
const STORAGE_KEY = 'hangar01-theme';

// The `data-theme` attribute on <html> is the single source of truth. Every
// component using this hook subscribes to the same store, so all toggles agree.
const listeners = new Set<() => void>();

function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
  writeStorage(STORAGE_KEY, theme);
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  // Follow changes made in other tabs.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    const next: Theme = e.newValue === 'light' ? 'light' : 'dark';
    if (next !== getTheme()) applyTheme(next);
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener('storage', onStorage);
  };
}

/** Initial theme when the pre-paint script did not run (e.g. it was blocked). */
if (
  typeof document !== 'undefined' &&
  readStorage(STORAGE_KEY) === 'light' &&
  getTheme() !== 'light'
) {
  document.documentElement.setAttribute('data-theme', 'light');
}

/** Active theme plus a toggle. Default is 'dark'. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, (): Theme => 'dark');
  const toggle = useCallback(() => applyTheme(getTheme() === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle } as const;
}
