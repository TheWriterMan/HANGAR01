import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, RotateCcw } from 'lucide-react';
import { BlogPost, ChecklistItem } from '../../types';
import { formatPostDate } from '../../utils/posts';
import { parseChecklistLines } from '../../utils/postChecklist';
import CardBadge, { CardBadgeVariant } from '../../components/ui/CardBadge';
import { MarkdownBlock, MarkdownBlocks, parseMarkdown } from './MarkdownComponents';
import PostChecklist from './PostChecklist';
import PostHeroBanner from './PostHeroBanner';

/** A post is a procedure when it embeds at least one `:::checklist` block. */
export const isProcedurePost = (content: string) => /^\s*:::checklist/m.test(content);

interface EmbeddedChecklist {
  key: string;
  title: string;
  items: ChecklistItem[];
}

interface Step {
  id: string;
  number: string;
  title: string;
  blocks: MarkdownBlock[];
  checklists: EmbeddedChecklist[];
}

type Checked = Record<string, Record<string, boolean>>;

const kebab = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Splits the post at its `##` headings into numbered steps. Text before the
 * first heading is the intro. A leading "1." in a heading is dropped, since
 * the step number is drawn.
 */
function buildProcedure(content: string) {
  const blocks = parseMarkdown(content);
  const intro: MarkdownBlock[] = [];
  const steps: Step[] = [];
  const checklists = new Map<MarkdownBlock, EmbeddedChecklist>();

  for (const block of blocks) {
    if (block.type === 'heading' && (block.level ?? 2) <= 2) {
      const title = block.lines.join(' ').replace(/^\d+\.\s+/, '');
      steps.push({
        id: kebab(title),
        number: String(steps.length + 1).padStart(2, '0'),
        title,
        blocks: [],
        checklists: [],
      });
      continue;
    }
    if (block.type === 'checklist') {
      const embedded = {
        key: `checklist-${checklists.size}`,
        title: block.title || 'Checklist',
        items: parseChecklistLines(block.lines),
      };
      checklists.set(block, embedded);
      steps[steps.length - 1]?.checklists.push(embedded);
    }
    (steps.length ? steps[steps.length - 1].blocks : intro).push(block);
  }

  return { intro, steps, checklists };
}

const countDone = (lists: EmbeddedChecklist[], checked: Checked) =>
  lists.reduce((n, c) => n + c.items.filter((i) => checked[c.key]?.[i.id]).length, 0);

const countAll = (lists: EmbeddedChecklist[]) => lists.reduce((n, c) => n + c.items.length, 0);

/**
 * Layout for posts built around checklists: numbered steps on a timeline, a
 * sticky step rail with live progress from lg, and a sticky progress strip
 * below it. Ticks are shared across every checklist in the post and kept for
 * the page view only.
 */
interface ProcedurePostProps {
  post: BlogPost;
  /** Rendered above and below the article in the reading column. */
  before?: React.ReactNode;
  after?: React.ReactNode;
}

const ProcedurePost: React.FC<ProcedurePostProps> = ({ post, before, after }) => {
  const { intro, steps, checklists } = useMemo(() => buildProcedure(post.content), [post.content]);
  const [checked, setChecked] = useState<Checked>({});
  const [activeIndex, setActiveIndex] = useState(0);

  const all = useMemo(() => [...checklists.values()], [checklists]);
  const total = countAll(all);
  const done = countDone(all, checked);
  const progress = total ? (done / total) * 100 : 0;
  const allDone = total > 0 && done === total;

  // The active step is the last one whose top has passed a third of the viewport.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      let index = 0;
      steps.forEach((step, i) => {
        const el = document.getElementById(step.id);
        if (el && el.getBoundingClientRect().top <= line) index = i;
      });
      setActiveIndex(index);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [steps]);

  const toggle = (key: string, id: string) =>
    setChecked((prev) => ({ ...prev, [key]: { ...prev[key], [id]: !prev[key]?.[id] } }));

  const renderChecklist = (block: MarkdownBlock) => {
    const list = checklists.get(block);
    if (!list) return null;
    return (
      <PostChecklist
        title={list.title}
        items={list.items}
        checked={checked[list.key] ?? {}}
        onToggle={(id) => toggle(list.key, id)}
      />
    );
  };

  const active = steps[activeIndex];

  return (
    <div className="layout-procedure">
      {/* ═══ STEP RAIL (lg) ═══ */}
      <aside className="hidden lg:block sticky top-(--height-shell) self-start pt-12">
        <nav aria-label="Steps">
          <p className="text-xs font-bold uppercase text-muted mb-3">Steps</p>
          <ol className="border-l border-border">
            {steps.map((step, i) => {
              const stepTotal = countAll(step.checklists);
              const stepDone = countDone(step.checklists, checked);
              const complete = stepTotal > 0 && stepDone === stepTotal;
              const isActive = i === activeIndex;
              return (
                <li key={step.id}>
                  <a
                    href={`#${step.id}`}
                    aria-current={isActive ? 'step' : undefined}
                    className={`-ml-px flex items-center gap-3 py-2.5 pl-4 pr-2 border-l-2 text-sm transition-colors duration-fast ${
                      isActive
                        ? 'border-l-accent text-primary bg-surface/50'
                        : 'border-l-border/0 text-muted hover:text-primary hover:bg-surface/30'
                    }`}
                  >
                    <span className="font-mono text-xs text-faint tabular-nums">{step.number}</span>
                    <span className="flex-1 min-w-0">{step.title}</span>
                    {complete ? (
                      <Check size={14} aria-label="Done" className="text-success shrink-0" />
                    ) : (
                      stepTotal > 0 && (
                        <span className="font-mono text-2xs text-faint tabular-nums">
                          {stepDone}/{stepTotal}
                        </span>
                      )
                    )}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs ${allDone ? 'text-success' : 'text-muted'}`}>
              {allDone ? 'All checks done' : 'Checks done'}
            </span>
            <span
              aria-live="polite"
              className={`font-mono text-xs tabular-nums ${allDone ? 'text-success' : 'text-muted'}`}
            >
              {done}/{total}
            </span>
          </div>
          <div
            className="h-1 bg-surface-raised"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Checks done"
          >
            <div
              className={`h-full transition-all duration-base ${allDone ? 'bg-success' : 'bg-accent'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {done > 0 && (
            <button
              type="button"
              onClick={() => setChecked({})}
              className="mt-4 inline-flex items-center gap-2 text-xs text-muted hover:text-primary transition-colors duration-fast"
            >
              <RotateCcw size={12} aria-hidden="true" />
              Reset checks
            </button>
          )}
        </div>
      </aside>

      {/* ═══ READING COLUMN ═══ */}
      <div className="min-w-0">
        {before}

        <article className="animate-fade-up">
          <header className="pb-8">
            <div className="flex items-center gap-4 mb-6">
              <CardBadge variant={post.category.toLowerCase() as CardBadgeVariant} />
              <span className="flex items-center text-sm text-muted">
                <Calendar size={14} aria-hidden="true" className="mr-2 text-accent" />
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt, 'long')}</time>
              </span>
            </div>
            <h1 className="type-display text-primary mb-6">{post.title}</h1>
            {(post.description || post.excerpt) && (
              <p className="text-lg text-muted leading-relaxed max-w-3xl">
                {post.description || post.excerpt}
              </p>
            )}
            <p className="mt-4 type-caption flex flex-wrap gap-x-2">
              <span>{steps.length} steps</span>
              <span aria-hidden="true">·</span>
              <span>{total} checks</span>
            </p>
          </header>

          {post.imageUrl && (
            <PostHeroBanner
              imageUrl={post.imageUrl}
              imageAltText={post.imageAltText}
              credit={post.imageCredit}
              creditUrl={post.imageCreditUrl}
            />
          )}

          {/* Progress strip below lg, where there is no rail */}
          <div className="lg:hidden sticky top-(--height-shell) z-sticky bg-base border-b border-border mt-8">
            <div className="flex items-center justify-between gap-4 py-3 text-xs">
              <span className="min-w-0 truncate text-muted">
                <span className="font-mono text-faint">{active?.number}</span>
                <span className="ml-2 text-primary">{active?.title}</span>
              </span>
              <span
                className={`font-mono tabular-nums shrink-0 ${allDone ? 'text-success' : 'text-muted'}`}
              >
                {done}/{total}
              </span>
            </div>
            <div className="h-1 bg-surface-raised -mb-px" aria-hidden="true">
              <div
                className={`h-full transition-all duration-base ${allDone ? 'bg-success' : 'bg-accent'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="prose prose-invert prose-lg max-w-none pt-10">
            <MarkdownBlocks blocks={intro} />
          </div>

          {/* ═══ STEPS ═══ */}
          <ol className="mt-6">
            {steps.map((step, i) => {
              const stepTotal = countAll(step.checklists);
              const complete = stepTotal > 0 && countDone(step.checklists, checked) === stepTotal;
              const isActive = i === activeIndex;
              const isLast = i === steps.length - 1;
              return (
                <li key={step.id} id={step.id} className="relative scroll-mt-40 lg:scroll-mt-28">
                  {!isLast && (
                    <div
                      aria-hidden="true"
                      className={`hidden md:block absolute left-6 top-12 bottom-0 w-px transition-colors duration-base ${
                        complete ? 'bg-success' : 'bg-border'
                      }`}
                    />
                  )}
                  <div className="flex items-center gap-4 md:gap-6">
                    <span
                      aria-hidden="true"
                      className={`shrink-0 w-10 h-10 md:w-12 md:h-12 border flex items-center justify-center font-mono text-sm tabular-nums transition-colors duration-base ${
                        complete
                          ? 'bg-success border-success text-inverted'
                          : isActive
                            ? 'bg-surface border-accent text-accent'
                            : 'bg-surface border-border text-muted'
                      }`}
                    >
                      {complete ? <Check size={18} className="stroke-[3px]" /> : step.number}
                    </span>
                    <h2 className="type-heading text-primary">
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </h2>
                  </div>
                  <div className="prose prose-invert prose-lg max-w-none pt-5 pb-12 md:pl-18">
                    <MarkdownBlocks blocks={step.blocks} renderChecklist={renderChecklist} />
                  </div>
                </li>
              );
            })}
          </ol>
        </article>

        {after}
      </div>
    </div>
  );
};

export default ProcedurePost;
