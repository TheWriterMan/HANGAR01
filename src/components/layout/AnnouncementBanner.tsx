import { Megaphone, X } from 'lucide-react';
import { useState, type FC } from 'react';
import { Link } from 'react-router-dom';

interface AnnouncementBannerProps {
  isDemo?: boolean;
}

/**
 * Change the id with the announcement, so a visitor who closed the old one sees the new one.
 * public/theme-init.js copies the closed id onto <html> before first paint, and the rule
 * below hides the bar then, so a closed banner never flashes in.
 */
const ANNOUNCEMENT_ID = 'open-source';
const STORAGE_KEY = 'hangar01-announcement-dismissed';

const AnnouncementBanner: FC<AnnouncementBannerProps> = ({ isDemo = false }) => {
  const [closed, setClosed] = useState(false);
  if (closed) return null;

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, ANNOUNCEMENT_ID);
    } catch {
      /* storage unavailable: it stays closed for this page view only */
    }
    document.documentElement.setAttribute('data-announcement-dismissed', ANNOUNCEMENT_ID);
    setClosed(true);
  };

  return (
    <div
      role={isDemo ? undefined : 'region'}
      aria-label={isDemo ? undefined : 'Announcement'}
      className="announcement-bar relative z-header flex items-center justify-center gap-2 bg-accent px-10 py-2 text-center"
    >
      {!isDemo && (
        <style>{`html[data-announcement-dismissed="${ANNOUNCEMENT_ID}"] .announcement-bar{display:none}`}</style>
      )}
      <Megaphone size={12} aria-hidden="true" className="shrink-0 text-inverted" />
      {/* Not .type-caption: its muted colour overrides text-inverted and fails contrast on the accent fill. */}
      <span className="text-xs font-medium text-inverted">
        <Link
          to="/news/hangar01-is-open-source"
          className="underline underline-offset-2 transition-opacity duration-fast hover:opacity-80"
        >
          HANGAR01 becomes free and open-source
        </Link>
      </span>
      {!isDemo && (
        <button
          type="button"
          onClick={close}
          aria-label="Close announcement"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center text-inverted transition-opacity duration-fast hover:opacity-70"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default AnnouncementBanner;
