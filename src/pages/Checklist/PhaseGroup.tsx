import React from 'react';
import { ChecklistItem as IChecklistItem, ChecklistPhase } from '../../types';
import ChecklistItem from '../../components/ui/ChecklistItem';
import { CheckCheck, XSquare, Check } from 'lucide-react';

interface PhaseGroupProps {
  phase: ChecklistPhase;
  completedItems: Record<string, boolean>;
  toggleItem: (itemKey: string) => void;
  checkAllInPhase: (phase: ChecklistPhase, targetState: boolean) => void;
  getItemKey: (item: IChecklistItem) => string;
  /**
   * The whole phase, when `phase` holds only some of its sections (the home hero's screen).
   * "Done" and Check All then cover all of it, as they do on the checklist page.
   */
  wholePhase?: ChecklistPhase;
  /**
   * The phase with every Full-mode item, when `phase` is filtered by mode (the checklist page).
   * Items and sections the mode leaves out are rendered hidden, so they stay in the page text.
   */
  allItems?: ChecklistPhase;
}

/**
 * An item the current mode leaves out, as plain text inside a hidden element: search engines read
 * it, nobody sees it, and it costs a few elements instead of a full interactive row. Switching
 * mode renders it as a ChecklistItem.
 */
const FoldedItem: React.FC<{ item: IChecklistItem }> = ({ item }) => (
  <p>
    {item.label}: {item.action}
    {item.info && ` (${item.info})`}
  </p>
);

/** A whole phase the current mode leaves out, folded the same way. Render it inside a hidden element. */
export const FoldedPhase: React.FC<{
  phase: ChecklistPhase;
  getItemKey: (item: IChecklistItem) => string;
}> = ({ phase, getItemKey }) => (
  <>
    <h2>{phase.title}</h2>
    {phase.groups.map((group, gIdx) => (
      <div key={gIdx}>
        <h3>{group.title}</h3>
        {group.items.map((item) => (
          <FoldedItem key={getItemKey(item)} item={item} />
        ))}
      </div>
    ))}
  </>
);

const PhaseGroup: React.FC<PhaseGroupProps> = ({
  phase,
  completedItems,
  toggleItem,
  checkAllInPhase,
  getItemKey,
  wholePhase = phase,
  allItems,
}) => {
  const shown = new Set(phase.groups.flatMap((g) => g.items));
  const groups = allItems?.groups ?? phase.groups;
  // Calculate completion for this phase
  const totalItems = wholePhase.groups.reduce((acc, g) => acc + g.items.length, 0);
  const checkedCount = wholePhase.groups.reduce((acc, g) => {
    return acc + g.items.filter((i) => completedItems[getItemKey(i)]).length;
  }, 0);
  const isComplete = totalItems > 0 && checkedCount === totalItems;

  const handleBatchToggle = () => {
    checkAllInPhase(wholePhase, !isComplete);
  };

  return (
    <div
      className={`mb-6 md:mb-10 transition-opacity duration-base ${isComplete ? 'opacity-50' : ''}`}
    >
      <div className="flex items-end justify-between mb-5 border-b-2 border-border pb-3">
        <div className="flex items-center gap-3">
          <h2 className="type-heading text-primary">{phase.title}</h2>
          {isComplete && (
            <span className="inline-flex items-center gap-1 text-2xs text-success bg-success/10 px-2 py-0.5 border border-success/20">
              <Check size={12} aria-hidden="true" />
              Done
            </span>
          )}
        </div>

        <button
          onClick={handleBatchToggle}
          className={`
                        shrink-0 text-xs border px-3 py-1.5 uppercase transition-all flex items-center gap-1.5
                        ${
                          isComplete
                            ? 'border-border text-muted hover:bg-surface-raised hover:text-primary'
                            : 'border-accent/30 text-accent hover:bg-accent hover:text-inverted'
                        }
                    `}
        >
          {isComplete ? (
            <>
              <XSquare size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Uncheck All</span>
              <span className="sm:hidden">Clear</span>
            </>
          ) : (
            <>
              <CheckCheck size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Check All</span>
              <span className="sm:hidden">All</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {groups.map((group, gIdx) => {
          const shownItems = group.items.filter((i) => shown.has(i));
          const groupTotal = shownItems.length;
          const groupChecked = shownItems.filter((i) => completedItems[getItemKey(i)]).length;
          const groupDone = groupTotal > 0 && groupChecked === groupTotal;

          if (groupTotal === 0) {
            return (
              <div key={gIdx} hidden>
                <h3>{group.title}</h3>
                {group.items.map((item) => (
                  <FoldedItem key={getItemKey(item)} item={item} />
                ))}
              </div>
            );
          }

          return (
            <div
              key={gIdx}
              className={`bg-base border border-border transition-opacity duration-base ${groupDone ? 'opacity-50' : ''}`}
            >
              <div className="bg-surface/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-medium text-accent">{group.title}</h3>
                <span
                  className={`
                                    text-2xs font-mono tabular-nums
                                    ${groupDone ? 'text-success' : 'text-muted'}
                                `}
                >
                  {groupChecked}/{groupTotal}
                </span>
              </div>
              <div className="columns-1 lg:columns-2 gap-8 p-0 block">
                {group.items.map((item) => {
                  const key = getItemKey(item);
                  if (!shown.has(item)) {
                    return (
                      <div key={key} hidden>
                        <FoldedItem item={item} />
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="break-inside-avoid">
                      <ChecklistItem
                        item={item}
                        isChecked={!!completedItems[key]}
                        onToggle={() => toggleItem(key)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseGroup;
