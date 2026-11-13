import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../../components/seo/SEO';
import PageLoadingState from '../../components/ui/PageLoadingState';
import { getLocalChecklist, LocalChecklist, toAircraft } from '../../utils/localChecklists';
import ChecklistView from '../Checklist/ChecklistView';

interface LoadResult {
  /** The id this result belongs to, so a stale result is never shown. */
  id: string;
  checklist: LocalChecklist | null;
}

/**
 * /hangar/:id: a My Hangar checklist, rendered by the same ChecklistView as the
 * built-in ones. It lives in this browser's IndexedDB, so the prerendered shell
 * and the first render show the loading state, and the checklist loads after.
 */
const LocalChecklistPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [result, setResult] = useState<LoadResult | null>(null);
  const loaded = result?.id === id;

  useEffect(() => {
    if (loaded) return;
    let live = true;
    void getLocalChecklist(id).then((checklist) => {
      if (live) setResult({ id, checklist });
    });
    return () => {
      live = false;
    };
  }, [id, loaded]);

  const aircraft = useMemo(
    () => (loaded && result?.checklist ? toAircraft(result.checklist) : null),
    [loaded, result],
  );

  if (!loaded) {
    return (
      <>
        <SEO title="My Hangar" path="/hangar" noindex />
        <PageLoadingState message="Loading checklist…" variant="fullPage" className="text-muted" />
      </>
    );
  }

  if (!aircraft) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <SEO title="Checklist Not Found" path="/hangar" noindex />
        <h1 className="type-display text-primary mb-4">Checklist not found</h1>
        <p className="text-muted type-body mb-8 max-w-md">
          It isn't saved in this browser. My Hangar keeps each checklist in the browser that
          imported it.
        </p>
        <Link
          to="/hangar"
          className="text-xs uppercase text-accent border border-accent px-4 py-2 hover:bg-accent hover:text-inverted transition-colors"
        >
          Open My Hangar
        </Link>
      </div>
    );
  }

  return <ChecklistView key={aircraft.slug} aircraft={aircraft} local />;
};

export default LocalChecklistPage;
