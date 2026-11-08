import React, { useState } from 'react';
import { ChecklistItem as IChecklistItem } from '../../types';
import { Check } from 'lucide-react';
import InfoBubble from './InfoBubble';

interface ChecklistItemProps {
  item: IChecklistItem;
  isChecked: boolean;
  onToggle: () => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, isChecked, onToggle }) => {
  const [isFlashing, setIsFlashing] = useState(false);

  const handleClick = () => {
    if (!isChecked) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);
    }
    onToggle();
  };

  // The row is a layout container. The checkbox is a sibling button stretched over it,
  // so the info button can sit above it instead of nested inside (ARIA checkbox children
  // are presentational). The visible label, action and box are hidden from assistive tech.
  return (
    <div
      className={`
            relative group flex items-center justify-between gap-3 sm:gap-0 py-3 px-4 
            border-b border-border/50 select-none
            transition-colors duration-base
            ${isChecked ? 'bg-surface/30' : 'hover:bg-surface-raised/30'}
            ${isFlashing ? '!bg-success/20' : ''}
        `}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        aria-label={`${item.label}: ${item.action}`}
        onClick={handleClick}
        className="absolute inset-0 w-full h-full cursor-pointer"
      />

      {/* Left: Label + Info icon */}
      <div className="flex items-center flex-1 min-w-0">
        <span
          aria-hidden="true"
          className={`
                    pointer-events-none font-medium text-sm
                    ${isChecked ? 'text-faint opacity-35' : 'text-primary'}
                    transition-all duration-base break-words whitespace-normal
                `}
        >
          {item.label}
        </span>
        {item.info && (
          <span className="relative inline-flex">
            <InfoBubble info={item.info} />
          </span>
        )}
      </div>

      {/* Leader Lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden sm:block flex-1 mx-4 border-b border-dotted border-border opacity-30 h-1"
      ></div>

      {/* Right: Action + Checkbox */}
      <div
        aria-hidden="true"
        className="pointer-events-none shrink-0 flex items-center justify-end gap-2 sm:gap-3 pl-0 sm:pl-2 max-w-[55%] sm:max-w-none"
      >
        <span
          className={`
                    text-xs sm:text-sm font-medium uppercase text-right
                    ${isChecked ? 'text-faint opacity-35' : 'text-accent'}
                `}
        >
          {item.action}
        </span>

        <div
          className={`
                    shrink-0 w-6 h-6 border transition-all duration-base flex items-center justify-center
                    ${isChecked ? 'bg-success border-success' : 'border-border group-hover:border-muted bg-surface'}
                `}
        >
          <Check
            size={16}
            aria-hidden="true"
            className={`text-inverted stroke-[3px] transition-transform duration-fast ${
              isChecked ? 'scale-100' : 'scale-0'
            }`}
          />
        </div>
      </div>

      {/* Active Selection Indicator */}
      <div
        className={`pointer-events-none absolute left-0 top-0 bottom-0 w-[2px] transition-colors ${isChecked ? 'bg-border/0' : 'bg-border/0 group-hover:bg-accent'}`}
      ></div>
    </div>
  );
};

export default ChecklistItem;
