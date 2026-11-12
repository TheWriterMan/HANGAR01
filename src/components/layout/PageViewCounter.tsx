import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '../../utils/events';

/** Sends a page_view for every page shown, including moves inside the app. Renders nothing. */
const PageViewCounter: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    track('page_view', {});
  }, [pathname]);
  return null;
};

export default PageViewCounter;
