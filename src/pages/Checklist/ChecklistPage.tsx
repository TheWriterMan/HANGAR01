import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAircraftBySlug, getAircraftList } from '../../services/aircraft';
import { InitialChecklistContext } from '../../services/initialChecklist';
import { Aircraft } from '../../types';
import PageLoadingState from '../../components/ui/PageLoadingState';
import NotFoundPage from '../NotFoundPage';
import ChecklistView from './ChecklistView';

interface LoadResult {
  /** The slug this result belongs to, so a stale result is never shown. */
  id: string;
  aircraft: Aircraft | null;
}

const ChecklistPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  // A prerendered page embeds its checklist, so the first render needs no fetch.
  const initial = useContext(InitialChecklistContext);
  const [result, setResult] = useState<LoadResult | null>(() =>
    initial?.slug === id ? { id, aircraft: initial } : null,
  );
  const loaded = result?.id === id;
  // Known from the bundled index, so an unknown slug renders the 404 page on the
  // first render and matches the prerendered 404.html.
  const exists = getAircraftList().some((ac) => ac.slug === id);

  useEffect(() => {
    if (loaded || !exists) return;
    const controller = new AbortController();
    fetchAircraftBySlug(id, controller.signal).then((aircraft) => {
      if (!controller.signal.aborted) setResult({ id, aircraft });
    });
    return () => controller.abort();
  }, [id, loaded, exists]);

  if (!exists) return <NotFoundPage />;

  if (!result || !loaded) {
    return (
      <PageLoadingState message="Loading checklist…" variant="fullPage" className="text-muted" />
    );
  }

  if (!result.aircraft) return <NotFoundPage />;

  return <ChecklistView key={result.aircraft.slug} aircraft={result.aircraft} />;
};

export default ChecklistPage;
