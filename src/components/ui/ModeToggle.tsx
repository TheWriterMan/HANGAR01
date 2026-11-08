import React from 'react';
import { Zap, List, BookOpen } from 'lucide-react';

export type ChecklistMode = 'quick' | 'normal' | 'full';

interface ModeToggleProps {
  mode: ChecklistMode;
  onChange: (mode: ChecklistMode) => void;
  quickCount: number;
  normalCount: number;
  fullCount: number;
}

/**
 * Three-segment toggle for switching between Full, Normal, and Quick views.
 * NOTE: no transitions on the active/inactive states — transitions cause a
 * visible "flash" on mobile where the previously-active button's tinted
 * background fades out slowly while the new selection fades in.
 */
const ModeToggle: React.FC<ModeToggleProps> = ({
  mode,
  onChange,
  quickCount,
  normalCount,
  fullCount,
}) => {
  // A checklist with no Normal-tier items shows the same list in Normal and Quick
  // (the King Air 350i and DA62). Offer Quick only, and treat a saved Normal as Quick.
  const normalSameAsQuick = normalCount === quickCount;
  const activeMode: ChecklistMode = normalSameAsQuick && mode === 'normal' ? 'quick' : mode;
  const allSegments: Array<{
    key: ChecklistMode;
    label: string;
    icon: React.ReactNode;
    count: number;
    activeClasses: string;
  }> = [
    {
      key: 'full',
      label: 'Full',
      icon: <BookOpen size={14} aria-hidden="true" />,
      count: fullCount,
      activeClasses: 'bg-surface-raised text-primary border-border',
    },
    {
      key: 'normal',
      label: 'Normal',
      icon: <List size={14} aria-hidden="true" />,
      count: normalCount,
      activeClasses: 'bg-accent/10 text-accent border-accent/30',
    },
    {
      key: 'quick',
      label: 'Quick',
      icon: <Zap size={14} aria-hidden="true" />,
      count: quickCount,
      activeClasses: 'bg-warning/10 text-warning border-warning/30',
    },
  ];
  const segments = normalSameAsQuick
    ? allSegments.filter((seg) => seg.key !== 'normal')
    : allSegments;

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (idx + 1) % segments.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (idx - 1 + segments.length) % segments.length;
    }
    if (nextIdx !== null) {
      onChange(segments[nextIdx].key);
      // Focus the new button after React re-renders
      const group = (e.currentTarget as HTMLElement).closest('[role="radiogroup"]');
      if (group) {
        const buttons = group.querySelectorAll<HTMLElement>('[role="radio"]');
        setTimeout(() => buttons[nextIdx!]?.focus(), 0);
      }
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Checklist depth"
      className={`grid ${segments.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 select-none`}
    >
      {segments.map((seg, idx) => {
        const isActive = activeMode === seg.key;
        return (
          <button
            key={seg.key}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${seg.label} mode, ${seg.count} items`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(seg.key)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`
                            flex flex-col items-center justify-center gap-0.5
                            px-2 py-3 border
                            text-xs font-medium
                           
                            ${
                              isActive
                                ? seg.activeClasses
                                : 'border-border text-muted hover:text-primary hover:border-border'
                            }
                        `}
          >
            <span className="flex items-center gap-1">
              {seg.icon}
              <span>{seg.label}</span>
            </span>
            <span className={`text-2xs font-mono ${isActive ? 'text-muted' : 'text-faint'}`}>
              {seg.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeToggle;
