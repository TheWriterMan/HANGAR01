import React, { useEffect, useRef, useState } from 'react';
import { Download, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { checklistToCsv, csvFileName } from '../../utils/checklistCsv';
import { LocalChecklist, renameLocalChecklist } from '../../utils/localChecklists';

const ACTION_BASE =
  'inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted transition-colors';
const ACTION_CLASS = `${ACTION_BASE} hover:text-primary`;

/** Saves text as a file through a temporary link. */
function downloadFile(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

interface ChecklistActionsProps {
  checklist: LocalChecklist;
  /** After a rename, so the list reloads. */
  onChanged: () => void;
  onReplace: (checklist: LocalChecklist) => void;
  onDelete: (checklist: LocalChecklist) => void;
}

/** The controls under a checklist's card on /hangar. Rename opens in place. */
const ChecklistActions: React.FC<ChecklistActionsProps> = ({
  checklist,
  onChanged,
  onReplace,
  onDelete,
}) => {
  const name = checklist.meta.name;
  const [renaming, setRenaming] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const renameButtonRef = useRef<HTMLButtonElement>(null);
  const inputId = `rename-${checklist.id}`;

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  const close = () => {
    setRenaming(false);
    setError('');
    // The button is back after this render.
    setTimeout(() => renameButtonRef.current?.focus(), 0);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = value.trim();
    if (!next) {
      setError("Enter the aircraft's name.");
      inputRef.current?.focus();
      return;
    }
    if (next === name) return close();
    if (await renameLocalChecklist(checklist.id, next)) {
      close();
      onChanged();
    } else {
      setError("The name couldn't be saved. Try again.");
    }
  };

  if (renaming) {
    return (
      <form onSubmit={handleRename} noValidate className="w-full py-2 space-y-2">
        <label htmlFor={inputId} className="block text-xs uppercase text-muted">
          Name
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          maxLength={80}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="w-full bg-base border border-border p-2 text-primary text-sm focus:border-accent transition-colors"
        />
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-danger text-xs">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="px-3 py-1.5 text-xs font-bold uppercase text-muted hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="border border-accent text-accent hover:bg-accent hover:text-inverted px-4 py-1.5 font-bold text-xs uppercase transition-all"
          >
            Save
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-x-1">
      <button
        ref={renameButtonRef}
        type="button"
        onClick={() => {
          setValue(name);
          setRenaming(true);
        }}
        aria-label={`Rename ${name}`}
        className={ACTION_CLASS}
      >
        <Pencil size={12} aria-hidden="true" />
        Rename
      </button>
      <button
        type="button"
        onClick={() => downloadFile(csvFileName(name), checklistToCsv(checklist.checklist))}
        aria-label={`Download CSV of ${name}`}
        className={ACTION_CLASS}
      >
        <Download size={12} aria-hidden="true" />
        Download CSV
      </button>
      <button
        type="button"
        onClick={() => onReplace(checklist)}
        aria-label={`Replace ${name} from a new CSV`}
        className={ACTION_CLASS}
      >
        <RefreshCw size={12} aria-hidden="true" />
        Replace
      </button>
      <button
        type="button"
        onClick={() => onDelete(checklist)}
        aria-label={`Delete ${name}`}
        className={`${ACTION_BASE} hover:text-danger`}
      >
        <Trash2 size={12} aria-hidden="true" />
        Delete
      </button>
    </div>
  );
};

export default ChecklistActions;
