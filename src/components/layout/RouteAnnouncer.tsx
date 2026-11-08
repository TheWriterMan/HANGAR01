import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Announces page changes to screen readers via an aria-live region.
 * On each route change, waits a tick for the new page title to render,
 * then sets it as the announcement text.
 */
const RouteAnnouncer: React.FC = () => {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Wait for the new page to render and update document.title
    const timer = setTimeout(() => {
      setAnnouncement(document.title || 'Page loaded');
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div aria-live="assertive" aria-atomic="true" role="status" className="sr-only">
      {announcement}
    </div>
  );
};

export default RouteAnnouncer;
