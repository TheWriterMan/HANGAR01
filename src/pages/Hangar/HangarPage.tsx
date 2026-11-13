import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import SEO from '../../components/seo/SEO';
import LocalChecklistCard from '../../components/ui/LocalChecklistCard';
import PageLoadingState from '../../components/ui/PageLoadingState';
import { useLocalChecklists } from '../../hooks/useLocalChecklists';
import { LOCAL_CHECKLIST_LIMIT } from '../../utils/checklistCsv';
import { deleteLocalChecklist, LocalChecklist } from '../../utils/localChecklists';
import ImportPanel from './ImportPanel';

/** What can delete a visitor's checklists, from the plan's "Storage lifetime". */
const STORAGE_FACTS = [
  "They're saved in this browser only. Other devices and browsers don't see them, so keep your CSV file as a backup.",
  'Clearing the cache usually keeps them. Clearing site data or cookies deletes them.',
  'Safari can delete them after 7 days without a visit.',
  'The browser may delete them when the device runs low on space. HANGAR01 asks it to keep them.',
  'A private window deletes them when it closes.',
  'With My Hangar open in two tabs, the last change wins.',
];

/** /hangar: the visitor's own checklists, the CSV import and how long they're kept. Noindex. */
const HangarPage: React.FC = () => {
  const { loaded, checklists, inMemory, refresh } = useLocalChecklists();
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const { hash } = useLocation();

  // The home page's "Import CSV" links to /hangar#import. The section only has its
  // final position once the list has loaded.
  useEffect(() => {
    if (loaded && hash === '#import') document.getElementById('import')?.scrollIntoView();
  }, [loaded, hash]);

  const handleDelete = async (checklist: LocalChecklist) => {
    const ok = window.confirm(
      `Delete "${checklist.meta.name}" and its ticks from this browser? This can't be undone.`,
    );
    if (!ok) return;
    await deleteLocalChecklist(checklist.id);
    refresh();
    listHeadingRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-base pb-20">
      <SEO
        title="My Hangar"
        description="Import your own checklist from a CSV file and tick it off as you fly. It's saved in your browser."
        path="/hangar"
        noindex
      />
      <div className="container-page pt-8 md:pt-16">
        <PageHeader
          title="MY "
          highlightedText="HANGAR"
          subtitle="Your own checklists, made from a spreadsheet. They work like the ones on HANGAR01 and stay in this browser."
          backLink={{ to: '/', label: 'Return home' }}
        />

        {inMemory && (
          <div
            role="status"
            className="-mt-4 mb-10 p-3 border border-warning bg-warning/10 text-warning text-xs"
          >
            This browser won't let HANGAR01 store checklists, so anything you import is lost when
            you close this tab.
          </div>
        )}

        <section aria-labelledby="hangar-list-heading">
          <div className="flex items-end justify-between gap-4 mb-6">
            <h2
              id="hangar-list-heading"
              ref={listHeadingRef}
              tabIndex={-1}
              className="type-title text-primary focus:outline-none"
            >
              Your Checklists
            </h2>
            {loaded && checklists.length > 0 && (
              <p className="type-caption shrink-0">
                {checklists.length} of {LOCAL_CHECKLIST_LIMIT}
              </p>
            )}
          </div>

          {!loaded ? (
            <PageLoadingState message="Loading…" className="py-10 text-sm text-muted" />
          ) : checklists.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted border border-border">
              No checklists yet. Import a CSV file below to make your first.
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {checklists.map((checklist) => (
                <li key={checklist.id}>
                  <LocalChecklistCard
                    checklist={checklist}
                    footer={
                      <button
                        type="button"
                        onClick={() => void handleDelete(checklist)}
                        aria-label={`Delete ${checklist.meta.name}`}
                        className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted hover:text-danger transition-colors"
                      >
                        <Trash2 size={12} aria-hidden="true" />
                        Delete
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="border-t border-border my-16" />

        <section id="import" aria-labelledby="hangar-import-heading" className="scroll-mt-24">
          <h2 id="hangar-import-heading" className="type-title text-primary mb-6">
            Import a CSV
          </h2>
          {loaded ? (
            <ImportPanel count={checklists.length} />
          ) : (
            <PageLoadingState message="Loading…" className="py-10 text-sm text-muted" />
          )}
        </section>

        <div className="border-t border-border my-16" />

        <section aria-labelledby="hangar-storage-heading">
          <h2 id="hangar-storage-heading" className="type-title text-primary mb-6">
            Where They&apos;re Kept
          </h2>
          <ul className="space-y-3 type-body text-muted max-w-2xl list-disc pl-5 marker:text-faint">
            {STORAGE_FACTS.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default HangarPage;
