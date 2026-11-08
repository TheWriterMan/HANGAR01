import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavLinkProps {
  label: string;
  to: string;
  className?: string;
}

/**
 * NavLink — top navigation link.
 *
 * | State   | Style                    |
 * |---------|--------------------------|
 * | Default | text-muted               |
 * | Active  | text-primary             |
 * | Hover   | text-primary             |
 *
 * No underline. Color change only.
 * Adds aria-current="page" when the link matches the current path.
 */
const NavLink: React.FC<NavLinkProps> = ({ label, to, className = '' }) => {
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(to + '/');

  return (
    <Link
      to={to}
      aria-current={isActive ? 'page' : undefined}
      className={`${isActive ? 'text-primary' : 'text-muted'} hover:text-primary transition-colors duration-fast text-xs font-medium uppercase ${className}`}
    >
      {label}
    </Link>
  );
};

export default NavLink;
