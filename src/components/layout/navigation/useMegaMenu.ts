import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { FocusEvent, KeyboardEvent, PointerEvent } from 'react';
import { navigationCategories } from './menuData';

export const useMegaMenu = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const location = useLocation();

  // Close both menus on navigation. Adjusting state during render (rather than
  // in an effect) avoids an extra commit with the stale menu still open.
  const routeKey = `${location.pathname}${location.search}`;
  const [prevRouteKey, setPrevRouteKey] = useState(routeKey);
  if (routeKey !== prevRouteKey) {
    setPrevRouteKey(routeKey);
    setActiveId(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!activeId) return;

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) setActiveId(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [activeId]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const handleChange = () => {
      if (media.matches) setMobileOpen(false);
      else setActiveId(null);
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const closeDesktop = useCallback(
    (restoreFocus = false) => {
      if (restoreFocus && activeId) triggerRefs.current.get(activeId)?.focus();
      setActiveId(null);
    },
    [activeId],
  );

  const handleShellPointerLeave = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse') closeDesktop();
    },
    [closeDesktop],
  );

  const handleShellBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget;
      if (next instanceof Node && !event.currentTarget.contains(next)) closeDesktop();
    },
    [closeDesktop],
  );

  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
      const index = navigationCategories.findIndex((category) => category.id === id);

      if (event.key === 'Escape') {
        event.preventDefault();
        closeDesktop(true);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveId(id);
        requestAnimationFrame(() => {
          document.querySelector<HTMLAnchorElement>(`#mega-menu-panel-${id} a[href]`)?.focus();
        });
        return;
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const offset = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex =
          (index + offset + navigationCategories.length) % navigationCategories.length;
        const next = navigationCategories[nextIndex];
        setActiveId(next.id);
        triggerRefs.current.get(next.id)?.focus();
      }
    },
    [closeDesktop],
  );

  const handleShellKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && activeId) {
        event.preventDefault();
        closeDesktop(true);
      }
    },
    [activeId, closeDesktop],
  );

  const openMobile = useCallback(() => {
    setActiveId(null);
    setMobileOpen(true);
  }, []);

  return {
    activeId,
    mobileOpen,
    shellRef,
    mobileTriggerRef,
    triggerRefs,
    setActiveId,
    closeDesktop,
    closeMobile: () => setMobileOpen(false),
    openMobile,
    handleShellBlur,
    handleShellKeyDown,
    handleShellPointerLeave,
    handleTriggerKeyDown,
  };
};
