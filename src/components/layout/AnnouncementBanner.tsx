import { Megaphone } from 'lucide-react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';

interface AnnouncementBannerProps {
  isDemo?: boolean;
}

const AnnouncementBanner: FC<AnnouncementBannerProps> = ({ isDemo = false }) => (
  <div
    role={isDemo ? undefined : 'region'}
    aria-label={isDemo ? undefined : 'Announcement'}
    className="relative z-header flex items-center justify-center gap-2 bg-accent px-4 py-2 text-center"
  >
    <Megaphone size={12} aria-hidden="true" className="shrink-0 text-inverted" />
    {/* Not .type-caption: its muted colour overrides text-inverted and fails contrast on the accent fill. */}
    <span className="text-xs font-medium text-inverted">
      New:{' '}
      <Link
        to="/aircraft?category=military"
        className="underline underline-offset-2 transition-opacity duration-fast hover:opacity-80"
      >
        Military checklists for the C-130J and F-35A are now available
      </Link>
    </span>
  </div>
);

export default AnnouncementBanner;
