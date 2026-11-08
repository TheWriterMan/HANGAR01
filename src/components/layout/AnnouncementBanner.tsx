import { X } from 'lucide-react';
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

/** GitHub's mark, from Primer Octicons (mark-github-24, MIT). */
const GITHUB_MARK =
  'M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943';

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
      <svg
        viewBox="0 0 24 24"
        width={16}
        height={16}
        aria-hidden="true"
        className="shrink-0 fill-current text-inverted"
      >
        <path d={GITHUB_MARK} />
      </svg>
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
