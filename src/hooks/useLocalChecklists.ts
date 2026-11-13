import { useCallback, useEffect, useState } from 'react';
import { isInMemory, listLocalChecklists, LocalChecklist } from '../utils/localChecklists';

export interface LocalChecklistsState {
  /** False in the prerender, during hydration and until IndexedDB answers. */
  loaded: boolean;
  /** Newest first. */
  checklists: LocalChecklist[];
  /** No IndexedDB: checklists last only as long as this tab. */
  inMemory: boolean;
  refresh: () => void;
}

/**
 * The visitor's My Hangar checklists. Loads after hydration, so the first
 * render matches the prerendered page, and again whenever the tab regains
 * focus, so a checklist added or deleted in another tab shows up.
 */
export function useLocalChecklists(): LocalChecklistsState {
  const [state, setState] = useState<Omit<LocalChecklistsState, 'refresh'>>({
    loaded: false,
    checklists: [],
    inMemory: false,
  });

  const refresh = useCallback(() => {
    void listLocalChecklists().then((checklists) =>
      setState({ loaded: true, checklists, inMemory: isInMemory() }),
    );
  }, []);

  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return { ...state, refresh };
}
