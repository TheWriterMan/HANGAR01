import React, { lazy, Suspense, useState } from 'react';
import type { ReportPanelProps } from './ReportPanel';

const ReportPanel = lazy(() => import('./ReportPanel'));

/**
 * The report panel, with its code loaded the first time someone opens it rather than with
 * every checklist page. It stays mounted afterwards, so it can animate closed.
 */
const LazyReportPanel: React.FC<ReportPanelProps> = (props) => {
  const [requested, setRequested] = useState(false);
  if (props.isOpen && !requested) setRequested(true);
  if (!requested && !props.isOpen) return null;
  return (
    <Suspense fallback={null}>
      <ReportPanel {...props} />
    </Suspense>
  );
};

export default LazyReportPanel;
