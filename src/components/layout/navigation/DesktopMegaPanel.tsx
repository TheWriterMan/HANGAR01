import { ArrowRight } from 'lucide-react';
import type { FC } from 'react';
import { Link } from 'react-router-dom';
import NavigationCard from './NavigationCard';
import type { NavigationCategory } from './menuData';

interface DesktopMegaPanelProps {
  category: NavigationCategory;
}

// Without a featured column the types get the full width, one row of up to four.
const gridColumns = (category: NavigationCategory) =>
  !category.featured && category.items.length >= 4 ? 'grid-cols-4' : 'grid-cols-3';

const DesktopMegaPanel: FC<DesktopMegaPanelProps> = ({ category }) => (
  <section
    id={`mega-menu-panel-${category.id}`}
    aria-label={`${category.label} navigation`}
    className="absolute left-0 right-0 top-full z-overlay max-h-[calc(100dvh-6rem)] overflow-y-auto border-b border-border bg-base animate-menu-in"
  >
    <div className="container-page py-8">
      <div className="grid grid-cols-12 gap-8">
        <div className={category.featured ? 'col-span-8' : 'col-span-12'}>
          <div className={`grid ${gridColumns(category)} gap-4`}>
            {category.items.map((item) => (
              <NavigationCard key={item.label} item={item} />
            ))}
          </div>
        </div>

        {category.featured && (
          <div className="col-span-4 border-l border-border pl-8">
            <div className="flex h-full flex-col">
              {category.featured.image && (
                <div className="mb-4 aspect-video overflow-hidden border border-border bg-surface">
                  <img
                    src={category.featured.image}
                    width={640}
                    height={360}
                    alt=""
                    className="h-full w-full object-cover opacity-80 transition-opacity duration-base hover:opacity-100"
                    loading="lazy"
                  />
                </div>
              )}
              <h3 className="text-sm font-medium text-primary">{category.featured.title}</h3>
              <p className="type-caption mt-1 text-muted">{category.featured.description}</p>
              {category.featured.to && (
                <Link
                  to={category.featured.to}
                  className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-medium text-accent transition-colors duration-fast hover:text-primary"
                >
                  View checklist
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </section>
);

export default DesktopMegaPanel;
