import { ChevronRight } from 'lucide-react';
import type { FC } from 'react';
import NavigationCard from './NavigationCard';
import NavigationIcon from './NavigationIcon';
import type { NavigationCategory } from './menuData';

interface MobileNavigationCategoryProps {
  category: NavigationCategory;
  expanded: boolean;
  onToggle: () => void;
}

const MobileNavigationCategory: FC<MobileNavigationCategoryProps> = ({
  category,
  expanded,
  onToggle,
}) => {
  const panelId = `mobile-navigation-${category.id}`;

  return (
    <section className="border-b border-border">
      <button
        type="button"
        aria-controls={panelId}
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-fast hover:bg-surface/50"
      >
        <span className="flex items-center gap-2.5">
          <span className={expanded ? 'text-accent' : 'text-muted'}>
            <NavigationIcon name={category.icon} />
          </span>
          <span
            className={
              expanded
                ? 'text-sm font-medium uppercase text-primary'
                : 'text-sm font-medium uppercase text-muted'
            }
          >
            {category.label}
          </span>
        </span>
        <ChevronRight
          size={14}
          aria-hidden="true"
          className={`text-muted transition-transform duration-base ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      <div id={panelId} hidden={!expanded} className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {category.items.map((item) => (
            <NavigationCard key={item.label} item={item} compact />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MobileNavigationCategory;
