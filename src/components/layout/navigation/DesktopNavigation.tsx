import type { FC, KeyboardEvent, MutableRefObject, PointerEvent } from 'react';
import { NavLink } from 'react-router-dom';
import DesktopMegaPanel from './DesktopMegaPanel';
import { navigationCategories } from './menuData';

interface DesktopNavigationProps {
  activeId: string | null;
  triggerRefs: MutableRefObject<Map<string, HTMLButtonElement>>;
  onChange: (id: string | null) => void;
  onTriggerKeyDown: (event: KeyboardEvent<HTMLButtonElement>, id: string) => void;
  isDemo?: boolean;
}

const DesktopNavigation: FC<DesktopNavigationProps> = ({
  activeId,
  triggerRefs,
  onChange,
  onTriggerKeyDown,
  isDemo = false,
}) => {
  const activeCategory = navigationCategories.find((category) => category.id === activeId);

  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (event.pointerType === 'mouse') onChange(id);
  };

  return (
    <nav
      aria-label={isDemo ? 'Demo primary navigation' : 'Primary'}
      className="hidden h-7 items-center gap-1 border-l border-border pl-6 md:flex"
    >
      {navigationCategories.map((category) => {
        const expanded = category.id === activeId;
        return (
          <button
            key={category.id}
            ref={(node) => {
              if (node) triggerRefs.current.set(category.id, node);
              else triggerRefs.current.delete(category.id);
            }}
            type="button"
            aria-controls={`mega-menu-panel-${category.id}`}
            aria-expanded={expanded}
            onClick={() => onChange(expanded ? null : category.id)}
            onFocus={() => {
              if (activeId) onChange(category.id);
            }}
            onKeyDown={(event) => onTriggerKeyDown(event, category.id)}
            onPointerEnter={(event) => handlePointerEnter(event, category.id)}
            className={`relative flex items-center px-3 py-1.5 text-xs font-medium uppercase transition-colors duration-fast ${
              expanded ? 'text-primary' : 'text-muted hover:text-primary'
            }`}
          >
            {category.label}
            <span
              aria-hidden="true"
              className={`absolute bottom-0 left-0 h-0.5 bg-accent transition-[width,opacity] duration-base ${
                expanded ? 'w-full opacity-100' : 'w-0 opacity-0'
              }`}
            />
          </button>
        );
      })}
      <NavLink
        to="/hangar"
        onFocus={() => onChange(null)}
        onPointerEnter={() => onChange(null)}
        className={({ isActive }) =>
          `relative flex items-center px-3 py-1.5 text-xs font-medium uppercase transition-colors duration-fast ${
            isActive ? 'text-primary' : 'text-muted hover:text-primary'
          }`
        }
      >
        My Hangar
      </NavLink>
      {activeCategory && <DesktopMegaPanel category={activeCategory} />}
    </nav>
  );
};

export default DesktopNavigation;
