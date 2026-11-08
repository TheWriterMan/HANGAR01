import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MarkdownBlock } from './MarkdownComponents';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface Entry {
  id: string;
  title: string;
  level: number;
}

/** Strips inline Markdown so a heading reads as plain text in the list. */
const plain = (text: string) => text.replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/[*`]/g, '');

/**
 * The post's sections as a plain list left of the article, sticky and centred
 * in the viewport from 1400px. The section being read is bright, the ones
 * already passed dim, the ones ahead stay muted. A post with `###` headings
 * lists those (the items); otherwise it lists its `##` headings.
 */
const PostTOC: React.FC<{ blocks: MarkdownBlock[] }> = ({ blocks }) => {
  const entries = useMemo<Entry[]>(
    () =>
      blocks
        .filter((b) => b.type === 'heading' && b.id)
        .map((b) => ({ id: b.id!, title: plain(b.lines.join(' ')), level: b.level ?? 2 })),
    [blocks],
  );
  const hasItems = entries.some((e) => e.level === 3);
  const items = hasItems ? entries.filter((e) => e.level === 3) : entries;

  const [activeId, setActiveId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!entries.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // The section being read is the last heading above the top third of the viewport.
      const line = window.innerHeight * 0.33;
      let current: string | null = null;
      for (const e of entries) {
        const el = document.getElementById(e.id);
        if (el && el.getBoundingClientRect().top <= line) current = e.id;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Pictures loading above the reader move the headings without a scroll.
    const resize = new ResizeObserver(onScroll);
    resize.observe(document.body);
    return () => {
      resize.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [entries]);

  // Keep the active row in view when the card is taller than the screen.
  useEffect(() => {
    const nav = navRef.current;
    const row = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!nav || !row) return;
    const rowTop =
      row.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop;
    const top = rowTop - nav.clientHeight / 2 + row.clientHeight / 2;
    nav.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [activeId, prefersReducedMotion]);

  if (items.length < 2) return null;

  const activeIndex = entries.findIndex((e) => e.id === activeId);
  // The section being read is the last listed item at or before the active heading.
  const activeItemId = (() => {
    for (let i = activeIndex; i >= 0; i--) {
      if (!hasItems || entries[i].level === 3) return entries[i].id;
    }
    return null;
  })();
  const activeItemIndex = items.findIndex((e) => e.id === activeItemId);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="print:hidden! hidden min-[1400px]:block absolute right-full top-0 bottom-0 mr-12 w-56">
      <div className="sticky top-(--height-shell,3rem) h-[calc(100vh-var(--height-shell,3rem))] flex items-center">
        <nav
          aria-label="On this page"
          ref={navRef}
          className="w-full max-h-[calc(100vh-var(--height-shell,3rem)-3rem)] overflow-y-auto overscroll-contain"
        >
          <ul className="space-y-0.5">
            {items.map((e, i) => {
              const active = i === activeItemIndex;
              const passed = activeItemIndex >= 0 && i < activeItemIndex;
              return (
                <li key={e.id}>
                  <a
                    href={`#${e.id}`}
                    onClick={(ev) => go(ev, e.id)}
                    aria-current={active ? 'location' : undefined}
                    className={`block py-1.5 text-[13px] leading-snug no-underline transition-colors duration-base hover:text-primary ${
                      active ? 'text-primary' : passed ? 'text-faint opacity-50' : 'text-muted'
                    }`}
                  >
                    {e.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default PostTOC;
