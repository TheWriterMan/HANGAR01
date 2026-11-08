import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';
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
 * The post's sections as a checklist card: a sticky panel left of the article,
 * centred in the viewport from 1400px. Each section is ticked once the reader
 * has scrolled past it, and the one being read carries the accent bar.
 * When a post has `###` headings, its `##` headings become the card's group
 * rows and the `###` headings its items, as phases and items do on a checklist.
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
  // Items before the active one are done. The active item's group counts as reached.
  const isDone = (e: Entry) => activeIndex >= 0 && entries.indexOf(e) < activeIndex;
  const activeItemId = (() => {
    if (activeIndex < 0) return null;
    for (let i = activeIndex; i >= 0; i--) {
      if (!hasItems || entries[i].level === 3) return entries[i].id;
    }
    return null;
  })();
  const doneCount = items.filter(isDone).length;

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="print:hidden! hidden min-[1400px]:block absolute right-full top-0 bottom-0 mr-10 w-60">
      <div className="sticky top-(--height-shell,3rem) h-[calc(100vh-var(--height-shell,3rem))] flex items-center">
        <nav
          aria-label="On this page"
          ref={navRef}
          className="w-full max-h-[calc(100vh-var(--height-shell,3rem)-3rem)] overflow-y-auto overscroll-contain bg-base border border-border"
        >
          <div className="sticky top-0 bg-surface px-4 py-2.5 border-b border-border flex items-center justify-between">
            <p className="text-sm font-medium text-accent">On this page</p>
            <span
              className={`text-2xs font-mono tabular-nums ${
                doneCount === items.length ? 'text-success' : 'text-muted'
              }`}
            >
              {doneCount}/{items.length}
            </span>
          </div>
          <ul>
            {entries.map((e) => {
              if (hasItems && e.level === 2) {
                return (
                  <li
                    key={e.id}
                    className="px-4 pt-3 pb-1.5 text-2xs font-medium uppercase tracking-wider text-muted"
                  >
                    <a
                      href={`#${e.id}`}
                      onClick={(ev) => go(ev, e.id)}
                      className="no-underline hover:text-primary"
                    >
                      {e.title}
                    </a>
                  </li>
                );
              }
              const done = isDone(e);
              const active = e.id === activeItemId;
              return (
                <li key={e.id} className="relative border-b border-border/50 last:border-b-0">
                  <a
                    href={`#${e.id}`}
                    onClick={(ev) => go(ev, e.id)}
                    aria-current={active ? 'location' : undefined}
                    className={`group no-underline flex items-center justify-between gap-3 px-4 py-2 text-[13px] leading-snug transition-colors duration-base ${
                      active
                        ? 'bg-surface/50 text-primary'
                        : done
                          ? 'text-faint hover:text-primary'
                          : 'text-muted hover:text-primary hover:bg-surface-raised/30'
                    }`}
                  >
                    <span className={done && !active ? 'opacity-60' : ''}>{e.title}</span>
                    <span
                      aria-hidden="true"
                      className={`shrink-0 w-3.5 h-3.5 border flex items-center justify-center transition-colors duration-base ${
                        done ? 'bg-success border-success' : 'border-border bg-surface'
                      }`}
                    >
                      <Check
                        size={10}
                        className={`text-inverted stroke-[3px] transition-transform duration-fast ${
                          done ? 'scale-100' : 'scale-0'
                        }`}
                      />
                    </span>
                  </a>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-0 top-0 bottom-0 w-[2px] ${
                      active ? 'bg-accent' : ''
                    }`}
                  />
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
