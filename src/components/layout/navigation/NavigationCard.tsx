import { ArrowRight } from 'lucide-react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import ComingSoonBadge from './ComingSoonBadge';
import type { NavigationItem } from './menuData';

interface NavigationCardProps {
  item: NavigationItem;
  compact?: boolean;
}

const NavigationCard: FC<NavigationCardProps> = ({ item, compact = false }) => {
  const content = compact ? (
    <>
      <img
        src={item.image}
        width={640}
        height={360}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${item.comingSoon ? 'opacity-30 grayscale' : 'opacity-60'}`}
        loading="lazy"
      />
      <div className="relative flex h-full flex-col justify-end bg-base/60 p-3">
        <div className="flex items-center gap-2">
          <span
            className={
              item.comingSoon
                ? 'text-xs font-medium text-muted/60'
                : 'text-xs font-medium text-primary'
            }
          >
            {item.label}
          </span>
          {item.comingSoon && <ComingSoonBadge />}
        </div>
        <p className="mt-1 line-clamp-2 text-2xs text-muted">{item.description}</p>
      </div>
    </>
  ) : (
    <>
      <div className="aspect-video overflow-hidden bg-surface">
        <img
          src={item.image}
          srcSet={item.imageSrcSet}
          sizes={item.imageSrcSet ? '(min-width: 1024px) 360px, 50vw' : undefined}
          width={640}
          height={360}
          alt=""
          className={`h-full w-full object-cover transition-[opacity,transform] duration-base ${
            item.comingSoon
              ? 'opacity-40 grayscale'
              : 'opacity-70 group-hover:scale-105 group-hover:opacity-100'
          }`}
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={
              item.comingSoon
                ? 'text-sm font-medium text-muted/60'
                : 'text-sm font-medium text-primary group-hover:text-accent'
            }
          >
            {item.label}
          </span>
          {item.comingSoon ? (
            <ComingSoonBadge />
          ) : (
            <ArrowRight
              size={12}
              aria-hidden="true"
              className="text-muted group-hover:translate-x-0.5 group-hover:text-accent"
            />
          )}
        </div>
        <p className="type-caption text-muted">{item.description}</p>
      </div>
    </>
  );

  const className = compact
    ? 'group relative block min-h-28 overflow-hidden border border-border'
    : 'group block h-full border border-border transition-colors duration-fast hover:border-accent/40';

  if (item.comingSoon) {
    return (
      <div
        className={`${className} cursor-not-allowed bg-surface/30 opacity-50`}
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link to={item.to} className={className} aria-label={`${item.label}: ${item.description}`}>
      {content}
    </Link>
  );
};

export default NavigationCard;
