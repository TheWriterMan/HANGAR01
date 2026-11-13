import { Mail, Menu } from 'lucide-react';
import { useEffect, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AnnouncementBanner from './AnnouncementBanner';
import DesktopNavigation from './navigation/DesktopNavigation';
import MobileNavigationDialog from './navigation/MobileNavigationDialog';
import { useMegaMenu } from './navigation/useMegaMenu';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';

interface HeaderProps {
  isDemo?: boolean;
}

const Header: FC<HeaderProps> = ({ isDemo = false }) => {
  const location = useLocation();
  const {
    activeId,
    mobileOpen,
    shellRef,
    mobileTriggerRef,
    triggerRefs,
    setActiveId,
    closeDesktop,
    closeMobile,
    openMobile,
    handleShellBlur,
    handleShellKeyDown,
    handleShellPointerLeave,
    handleTriggerKeyDown,
  } = useMegaMenu();

  // Sticky elements below the header sit at --height-shell: the bar plus the
  // announcement banner when it shows (its height changes as it wraps).
  useEffect(() => {
    const shell = shellRef.current;
    if (isDemo || !shell) return;
    const observer = new ResizeObserver(() =>
      document.documentElement.style.setProperty('--height-shell', `${shell.offsetHeight}px`),
    );
    observer.observe(shell);
    return () => observer.disconnect();
  }, [isDemo, shellRef]);

  const isChecklistPage = /^\/(?:aircraft|hangar)\/[^/]+$/.test(location.pathname);
  const HeaderBar = isDemo ? 'div' : 'header';

  return (
    // Delegated handlers: blur/Escape/pointer-leave bubble up from the real
    // buttons and links inside; the wrapper itself is not interactive.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={shellRef}
      className={isDemo ? 'relative z-header' : 'sticky top-0 z-header print:hidden!'}
      onBlur={handleShellBlur}
      onKeyDown={handleShellKeyDown}
      onPointerLeave={handleShellPointerLeave}
    >
      {!isChecklistPage && <AnnouncementBanner isDemo={isDemo} />}

      <HeaderBar className="relative z-header flex h-12 items-center justify-between border-b border-border bg-base px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            aria-label="HANGAR_01 — home"
            onFocus={() => closeDesktop()}
            onPointerEnter={() => closeDesktop()}
            className="flex items-center gap-2.5 transition-colors duration-fast hover:text-accent"
          >
            <Logo className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-primary">
              HANGAR<span className="text-accent">_01</span>
            </span>
          </Link>

          <DesktopNavigation
            activeId={activeId}
            triggerRefs={triggerRefs}
            onChange={setActiveId}
            onTriggerKeyDown={handleTriggerKeyDown}
            isDemo={isDemo}
          />
        </div>

        <div
          className="flex items-center gap-3"
          onFocus={() => closeDesktop()}
          onPointerEnter={() => closeDesktop()}
        >
          <ThemeToggle />
          <Link
            to="/contact"
            className="hidden items-center gap-2 bg-accent px-5 py-2 text-xs font-medium uppercase text-inverted transition-colors duration-fast hover:bg-accent/90 md:inline-flex"
          >
            <Mail size={12} aria-hidden="true" />
            Contact
          </Link>
          <button
            ref={mobileTriggerRef}
            type="button"
            aria-controls="mobile-navigation-dialog"
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            onClick={openMobile}
            className="border border-border p-2 text-muted transition-colors duration-fast hover:border-muted hover:text-primary md:hidden"
          >
            <Menu size={16} aria-hidden="true" />
          </button>
        </div>
      </HeaderBar>

      {activeId && (
        <div
          className="fixed inset-0 z-sticky hidden bg-base/60 md:block"
          aria-hidden="true"
          onClick={() => closeDesktop()}
          onPointerEnter={() => closeDesktop()}
        />
      )}

      <MobileNavigationDialog
        open={mobileOpen}
        onDismiss={closeMobile}
        triggerRef={mobileTriggerRef}
      />
    </div>
  );
};

export default Header;
