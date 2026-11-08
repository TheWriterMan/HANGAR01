import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { BASE_URL } from '../seo/SEO';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface Crumb {
  label: string;
  /** Path of the page. The last crumb is the current page. */
  to: string;
}

/** BreadcrumbList JSON-LD for the same trail. Pass it to <SEO jsonLd>. */
export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: `${BASE_URL}${crumb.to}`,
    })),
  };
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
  className?: string;
}

/** Visible trail to the current page. The current page is the last crumb. */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ crumbs, className = '' }) => {
  const { pathname } = useLocation();
  const prefersReducedMotion = useReducedMotion();
  // A crumb to the page already open (Home, in the home hero's screen) goes to its top, as a
  // link to the page would; the router alone does nothing for the same path.
  const toTopIfHere = (to: string) => (event: React.MouseEvent) => {
    if (to !== pathname) return;
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="flex items-center gap-1.5 text-xs text-muted min-w-0">
        {crumbs.map((crumb, i) => {
          const isCurrent = i === crumbs.length - 1;
          return (
            <li
              key={crumb.to}
              className={`flex items-center gap-1.5 ${isCurrent ? 'min-w-0' : 'shrink-0'}`}
            >
              {i > 0 && (
                <ChevronRight size={12} aria-hidden="true" className="shrink-0 text-faint" />
              )}
              {isCurrent ? (
                <span aria-current="page" className="text-primary truncate">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  onClick={toTopIfHere(crumb.to)}
                  className="hover:text-primary transition-colors duration-fast"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
