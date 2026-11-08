import React, { useState } from 'react';
import ChecklistItem from '../../components/ui/ChecklistItem';
import { ChecklistItem as IChecklistItem } from '../../types';

interface PostChecklistProps {
  title: string;
  items: IChecklistItem[];
  /** Pass both to let the page own the state (procedure posts track progress across checklists). */
  checked?: Record<string, boolean>;
  onToggle?: (id: string) => void;
}

/**
 * Short interactive checklist embedded in a post between instructions.
 * Written in markdown as:
 *
 *   :::checklist Before Taxi
 *   Parking Brake | SET
 *   Transponder | STBY | Optional info bubble text
 *   :::
 *
 * State is local to the page view. Nothing is persisted.
 */
const PostChecklist: React.FC<PostChecklistProps> = ({ title, items, ...controlled }) => {
  const [localChecked, setLocalChecked] = useState<Record<string, boolean>>({});
  const checked = controlled.checked ?? localChecked;
  const toggle =
    controlled.onToggle ??
    ((id: string) => setLocalChecked((prev) => ({ ...prev, [id]: !prev[id] })));
  const done = items.filter((i) => checked[i.id]).length;
  const complete = items.length > 0 && done === items.length;

  return (
    <section
      aria-label={`${title} checklist`}
      className={`my-8 bg-base border border-border transition-opacity duration-base ${complete ? 'opacity-50' : ''}`}
    >
      <div className="bg-surface/50 px-4 py-2.5 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-accent">{title}</h3>
        <span
          aria-live="polite"
          className={`text-2xs font-mono tabular-nums ${complete ? 'text-success' : 'text-muted'}`}
        >
          {done}/{items.length}
        </span>
      </div>
      <div>
        {items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            isChecked={!!checked[item.id]}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default PostChecklist;
