import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CornerDownLeft, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAircraftList } from '../../services/aircraft';
import { AircraftSummary } from '../../types';

const AircraftSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [aircraft, setAircraft] = useState<AircraftSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Fetch aircraft list on mount.
  useEffect(() => {
    let cancelled = false;
    fetchAircraftList()
      .then((data) => {
        if (!cancelled) setAircraft(data ?? []);
      })
      .catch((err) => {
        console.error('AircraftSearch: failed to fetch aircraft list', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Filter — searches model, manufacturer, suffix, and systems type.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aircraft;
    return aircraft.filter((a) => {
      const haystack = [a.model, a.manufacturer, a.suffix, a.systemsType, a.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, aircraft]);

  // The highlighted option resets whenever the list opens or the filter changes.
  const openList = () => {
    setActiveIdx(0);
    setOpen(true);
  };
  const changeQuery = (value: string) => {
    setActiveIdx(0);
    setQuery(value);
  };

  const goTo = (slug: string) => {
    setOpen(false);
    setQuery('');
    navigate(`/aircraft/${slug}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      openList();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const target = filtered[activeIdx];
      if (target) {
        e.preventDefault();
        goTo(target.slug);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div
        className={`flex items-center gap-3 bg-surface border transition-colors ${
          open ? 'border-accent' : 'border-border'
        }`}
      >
        <span className="pl-4 text-accent shrink-0">
          <Search size={16} strokeWidth={2.25} aria-hidden="true" />
        </span>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(e) => {
            changeQuery(e.target.value);
            if (!open) openList();
          }}
          onFocus={() => {
            if (!open) openList();
          }}
          onKeyDown={onKeyDown}
          placeholder={loading ? 'Loading aircraft…' : 'Search aircraft, e.g. 737, A320, TBM…'}
          aria-label="Search aircraft"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="aircraft-search-listbox"
          aria-activedescendant={
            open && filtered.length > 0 ? `aircraft-option-${activeIdx}` : undefined
          }
          className="flex-1 py-3.5 text-sm text-primary placeholder:text-faint outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              changeQuery('');
              inputRef.current?.focus();
            }}
            className="text-faint hover:text-primary transition-colors shrink-0"
            aria-label="Clear search"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
        <span className="pr-4 font-mono text-2xs uppercase text-faint shrink-0">
          {loading ? '…' : `${filtered.length}`}
        </span>
      </div>

      {/* Live region for screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {open &&
          !loading &&
          (filtered.length === 0
            ? `No aircraft found for ${query}`
            : `${filtered.length} aircraft found`)}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border z-overlay text-left"
            role="listbox"
            id="aircraft-search-listbox"
          >
            <div className="max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center type-mono text-faint">
                  No aircraft found for "{query}".
                </div>
              ) : (
                filtered.map((a, i) => {
                  const isActive = i === activeIdx;
                  return (
                    <Link
                      key={a.slug}
                      to={`/aircraft/${a.slug}`}
                      onClick={() => {
                        setOpen(false);
                        setQuery('');
                      }}
                      onMouseEnter={() => setActiveIdx(i)}
                      role="option"
                      id={`aircraft-option-${i}`}
                      aria-selected={isActive}
                      className={`group flex items-center gap-3 px-4 py-3 border-b border-border/40 transition-colors ${
                        isActive ? 'bg-surface-raised/60' : 'hover:bg-surface-raised/30'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-primary truncate">{a.model}</div>
                        <div className="text-2xs text-muted uppercase truncate">
                          {a.manufacturer}
                        </div>
                      </div>
                      {a.systemsType && (
                        <span className="hidden sm:inline-block font-mono text-2xs uppercase text-muted border border-border px-1.5 py-0.5 shrink-0">
                          {a.systemsType}
                        </span>
                      )}
                      {a.status === 'coming-soon' && (
                        <span className="font-mono text-2xs uppercase text-warning border border-warning/40 px-1.5 py-0.5 shrink-0">
                          SOON
                        </span>
                      )}
                    </Link>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-border/60 flex items-center justify-between bg-surface-raised/30">
              <span className="text-2xs uppercase text-faint flex items-center gap-2">
                <CornerDownLeft size={12} aria-hidden="true" /> to open · esc to close
              </span>
              <Link
                to="/aircraft"
                onClick={() => setOpen(false)}
                className="text-2xs uppercase text-accent hover:underline font-medium"
              >
                View all →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AircraftSearch;
