import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import NewsletterForm from './NewsletterForm';
import Logo from '../ui/Logo';

interface FooterProps {
  isDemo?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isDemo = false }) => {
  const FooterTag = isDemo ? 'div' : 'footer';
  const NavTag = isDemo ? 'div' : 'nav';
  // The home hero's photo is CC BY 4.0, which asks for title, author, source, licence and
  // whether it was changed, on the page that shows it.
  const { pathname } = useLocation();
  const showHeroCredit = !isDemo && pathname === '/';
  return (
    <FooterTag className="relative border-t border-border print:hidden!">
      <div className="container-page py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
          {/* Left — Brand + Links */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Logo className="w-5 h-5 text-primary" />
              <span className="font-bold text-primary text-lg relative">
                HANGAR<span className="text-accent">_01</span>
                <span className="absolute -top-1 -right-10 text-muted text-2xs font-normal">
                  v1.1.1
                </span>
              </span>
            </div>

            <p className="type-body text-muted max-w-sm">
              Free interactive checklists for Microsoft Flight Simulator, phase by phase, for
              default aircraft and add-ons.
            </p>

            <NavTag
              aria-label={isDemo ? undefined : 'Footer'}
              className="flex flex-wrap gap-x-5 gap-y-2 pt-2"
            >
              <Link
                to="/aircraft"
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                Aircraft
              </Link>
              <Link to="/news" className="text-sm text-muted hover:text-primary transition-colors">
                News
              </Link>
              <Link
                to="/changelog"
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                Changelog
              </Link>
              <Link
                to="/contact"
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                Contact
              </Link>
              <Link to="/about" className="text-sm text-muted hover:text-primary transition-colors">
                About
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                Privacy
              </Link>
            </NavTag>
          </div>

          {/* Right — Email Capture */}
          <NewsletterForm />
        </div>
        {showHeroCredit && (
          <p className="mt-12 text-xs text-muted">
            Hero photo:{' '}
            <a
              href="https://commons.wikimedia.org/wiki/File:Sunrise_in_a_172_by_Don_Ramey_Logan.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              Sunrise in a 172
            </a>
            , photograph by Don Ramey Logan, Wikimedia Commons,{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-primary transition-colors"
            >
              CC BY 4.0
            </a>
            , cropped and darkened.
          </p>
        )}
      </div>
    </FooterTag>
  );
};

export default Footer;
