import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Upload } from 'lucide-react';
import {
  CSV_LIMITS,
  CsvConversion,
  CsvIssue,
  LOCAL_CHECKLIST_LIMIT,
  nameFromFileName,
  parseChecklistCsv,
  SAMPLE_CSV_URL,
} from '../../utils/checklistCsv';
import {
  addLocalChecklist,
  LocalChecklist,
  replaceLocalChecklistItems,
} from '../../utils/localChecklists';

/** Rows shown in the problems table; the rest are counted. */
const MAX_ISSUES_SHOWN = 100;

const INPUT_CLASS =
  'w-full bg-base border border-border p-3 text-primary text-sm focus:border-accent transition-colors placeholder:text-faint';
const LABEL_CLASS = 'block text-xs uppercase text-muted';

interface Preview {
  /** The file's name, or null for pasted cells. */
  fileName: string | null;
  result: CsvConversion;
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

const tooBig = (fileName: string): Preview => ({
  fileName,
  result: {
    checklist: [],
    itemCount: 0,
    groupCount: 0,
    errors: [{ row: null, message: 'The file is over 500 KB.' }],
    warnings: [],
  },
});

interface ImportPanelProps {
  /** How many checklists My Hangar already holds. */
  count: number;
  /** Replace mode: the new CSV's items go into this checklist, keeping its name and matching ticks. */
  replacing?: LocalChecklist | null;
  onCancelReplace?: () => void;
}

/**
 * Choose, drop or paste a CSV, preview what it becomes with every problem by row,
 * then name the aircraft and save. Papa Parse loads only when something is imported.
 */
const ImportPanel: React.FC<ImportPanelProps> = ({ count, replacing = null, onCancelReplace }) => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pasted, setPasted] = useState('');
  const [details, setDetails] = useState({ name: '', manufacturer: '', sim: '', addon: '' });
  const [nameError, setNameError] = useState('');
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const full = !replacing && count >= LOCAL_CHECKLIST_LIMIT;

  // Move to the preview once it shows, so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (preview) previewHeadingRef.current?.focus();
  }, [preview]);

  const showPreview = (next: Preview) => {
    setPreview(next);
    setDetails({
      name: next.fileName ? nameFromFileName(next.fileName).slice(0, 80) : '',
      manufacturer: '',
      sim: '',
      addon: '',
    });
    setNameError('');
    setSaveError('');
  };

  const convert = async (text: string, fileName: string | null) => {
    setBusy(true);
    try {
      const { default: Papa } = await import('papaparse');
      showPreview({ fileName, result: parseChecklistCsv(text, Papa) });
    } catch {
      showPreview({
        fileName,
        result: {
          checklist: [],
          itemCount: 0,
          groupCount: 0,
          errors: [{ row: null, message: "The file couldn't be read. Try again." }],
          warnings: [],
        },
      });
    } finally {
      setBusy(false);
    }
  };

  const importFile = async (file: File) => {
    if (file.size > CSV_LIMITS.fileBytes) {
      showPreview(tooBig(file.name));
      return;
    }
    await convert(await file.text(), file.name);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Cleared, so choosing the same file again (after fixing it) fires a change.
    e.target.value = '';
    if (file) void importFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !full) void importFile(file);
  };

  const reset = () => {
    setPreview(null);
    setPasted('');
    fileInputRef.current?.focus();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    const name = details.name.trim();
    if (!name) {
      setNameError("Enter the aircraft's name.");
      nameRef.current?.focus();
      return;
    }
    setBusy(true);
    setSaveError('');
    const saved = await addLocalChecklist(
      {
        name,
        manufacturer: details.manufacturer.trim() || undefined,
        sim: details.sim.trim() || undefined,
        addon: details.addon.trim() || undefined,
      },
      preview.result.checklist,
    );
    setBusy(false);
    if (saved.ok) {
      navigate(`/hangar/${saved.checklist.id}`);
    } else if (saved.reason === 'limit') {
      setSaveError(
        `My Hangar holds ${LOCAL_CHECKLIST_LIMIT} checklists. Delete one to save this one.`,
      );
    } else {
      setSaveError("The checklist couldn't be saved. Your browser's storage may be full.");
    }
  };

  const handleReplace = async () => {
    if (!preview || !replacing) return;
    setBusy(true);
    setSaveError('');
    const saved = await replaceLocalChecklistItems(replacing.id, preview.result.checklist);
    setBusy(false);
    if (saved) navigate(`/hangar/${saved.id}`);
    else setSaveError("The checklist couldn't be saved. Your browser's storage may be full.");
  };

  const setField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
    if (name === 'name' && nameError) setNameError('');
  };

  if (preview) {
    const { result, fileName } = preview;
    const issues: (CsvIssue & { kind: 'Error' | 'Warning' })[] = [
      ...result.errors.map((issue) => ({ ...issue, kind: 'Error' as const })),
      ...result.warnings.map((issue) => ({ ...issue, kind: 'Warning' as const })),
    ];
    const blocked = result.errors.length > 0;

    return (
      <div className="bg-surface/20 border border-border p-6 md:p-8 space-y-8">
        <div>
          <h3
            ref={previewHeadingRef}
            tabIndex={-1}
            className="type-heading text-primary break-words focus:outline-none"
          >
            Preview
          </h3>
          <p className="type-caption mt-1 break-words">{fileName ?? 'Pasted cells'}</p>
          {!blocked && (
            <p className="type-body text-primary mt-3">
              {plural(result.checklist.length, 'phase')}, {plural(result.groupCount, 'group')},{' '}
              {plural(result.itemCount, 'item')}.
            </p>
          )}
        </div>

        {!blocked && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Phases in this checklist</caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase text-faint">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Phase
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Groups
                  </th>
                  <th scope="col" className="py-2 font-medium text-right">
                    Items
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.checklist.map((phase) => (
                  <tr key={phase.id} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-4 text-primary break-words">{phase.title}</td>
                    <td className="py-2 pr-4 text-muted break-words">
                      {phase.groups.map((g) => g.title).join(', ')}
                    </td>
                    <td className="py-2 text-muted text-right tabular-nums">
                      {phase.groups.reduce((n, g) => n + g.items.length, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {issues.length > 0 && (
          <div>
            <h4 className="type-subheading text-primary mb-2">
              {[
                result.errors.length > 0 && plural(result.errors.length, 'error'),
                result.warnings.length > 0 && plural(result.warnings.length, 'warning'),
              ]
                .filter(Boolean)
                .join(', ')}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <caption className="sr-only">Problems found in the file, by row</caption>
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-faint">
                    <th scope="col" className="py-2 pr-4 font-medium w-16">
                      Row
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium w-24">
                      Type
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Problem
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {issues.slice(0, MAX_ISSUES_SHOWN).map((issue, i) => (
                    <tr key={i} className="border-b border-border/50 align-top">
                      <td className="py-2 pr-4 text-muted tabular-nums">{issue.row ?? 'File'}</td>
                      <td
                        className={`py-2 pr-4 text-xs font-medium uppercase ${
                          issue.kind === 'Error' ? 'text-danger' : 'text-warning'
                        }`}
                      >
                        {issue.kind}
                      </td>
                      <td className="py-2 text-muted break-words">{issue.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {issues.length > MAX_ISSUES_SHOWN && (
              <p className="type-caption mt-2">
                {plural(issues.length - MAX_ISSUES_SHOWN, 'more problem')} not shown.
              </p>
            )}
          </div>
        )}

        {blocked ? (
          <div className="pt-4 border-t border-border space-y-4">
            <p role="alert" className="type-body text-danger">
              Fix the errors in the file, then import it again.
            </p>
            <button
              type="button"
              onClick={reset}
              className="border border-accent text-accent hover:bg-accent hover:text-inverted px-6 py-2.5 font-bold text-xs uppercase transition-all"
            >
              Import another file
            </button>
          </div>
        ) : replacing ? (
          <div className="pt-6 border-t border-border space-y-4">
            <p className="type-body text-muted max-w-2xl">
              These items replace the ones in{' '}
              <strong className="text-primary font-medium break-words">
                {replacing.meta.name}
              </strong>
              . Ticks stay on items whose phase and id are unchanged.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-end gap-3 border-t border-border">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2.5 text-xs font-bold uppercase text-muted hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReplace()}
                disabled={busy}
                className="border border-accent text-accent hover:bg-accent hover:text-inverted px-6 py-2.5 font-bold text-xs uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Replace checklist
              </button>
            </div>
            {saveError && (
              <div
                role="alert"
                className="p-3 bg-danger/20 border border-danger text-danger text-xs"
              >
                {saveError}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} noValidate className="pt-6 border-t border-border space-y-6">
            <h4 className="type-subheading text-primary">Aircraft</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="hangar-name" className={LABEL_CLASS}>
                  Name{' '}
                  <span className="text-danger" aria-hidden="true">
                    *
                  </span>
                  <span className="sr-only">(required)</span>
                </label>
                <input
                  ref={nameRef}
                  id="hangar-name"
                  name="name"
                  type="text"
                  required
                  maxLength={80}
                  autoComplete="off"
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? 'hangar-name-error' : undefined}
                  value={details.name}
                  onChange={setField}
                  className={INPUT_CLASS}
                  placeholder="Cessna 172"
                />
                {nameError && (
                  <p id="hangar-name-error" role="alert" className="text-danger text-xs">
                    {nameError}
                  </p>
                )}
              </div>
              {(
                [
                  ['manufacturer', 'Manufacturer', 'Cessna'],
                  ['addon', 'Add-on', 'Microsoft'],
                  ['sim', 'Sim', 'MSFS 2024'],
                ] as const
              ).map(([field, label, placeholder]) => (
                <div key={field} className="space-y-2">
                  <label htmlFor={`hangar-${field}`} className={LABEL_CLASS}>
                    {label}
                  </label>
                  <input
                    id={`hangar-${field}`}
                    name={field}
                    type="text"
                    maxLength={80}
                    autoComplete="off"
                    value={details[field]}
                    onChange={setField}
                    className={INPUT_CLASS}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-end gap-3 border-t border-border">
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2.5 text-xs font-bold uppercase text-muted hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="border border-accent text-accent hover:bg-accent hover:text-inverted px-6 py-2.5 font-bold text-xs uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save to My Hangar
              </button>
            </div>
            {saveError && (
              <div
                role="alert"
                className="p-3 bg-danger/20 border border-danger text-danger text-xs"
              >
                {saveError}
              </div>
            )}
          </form>
        )}
      </div>
    );
  }

  if (full) {
    return (
      <div className="bg-surface/20 border border-border p-6 md:p-8">
        <p className="type-body text-muted">
          My Hangar holds {LOCAL_CHECKLIST_LIMIT} checklists. Delete one to import another.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {replacing && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border border-accent/40 bg-accent/10">
          <p className="type-body text-primary break-words min-w-0">
            Choose the new CSV for {replacing.meta.name}. Download its CSV first to keep the ids,
            and with them the ticks.
          </p>
          <button
            type="button"
            onClick={onCancelReplace}
            className="px-4 py-2 text-xs font-bold uppercase text-muted hover:text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      <p className="type-body text-muted max-w-2xl">
        One row per item. The file needs <strong className="text-primary font-medium">phase</strong>
        , <strong className="text-primary font-medium">label</strong> and{' '}
        <strong className="text-primary font-medium">action</strong> columns. Group, tier (quick,
        normal or full), info and id are optional. The sample shows the format.
      </p>

      {/* The drop target is the whole box; the file input is the way in for keyboard and touch. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border p-6 md:p-10 flex flex-col items-center gap-4 text-center transition-colors duration-fast ${
          dragging ? 'border-accent bg-accent/10' : 'border-border bg-surface/20'
        }`}
      >
        <Upload size={20} aria-hidden="true" className="text-muted" />
        <div>
          <input
            ref={fileInputRef}
            id="hangar-csv-file"
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            onChange={handleFileChange}
            disabled={busy}
            className="peer sr-only"
          />
          <label
            htmlFor="hangar-csv-file"
            className="inline-flex items-center gap-2 cursor-pointer bg-primary text-inverted px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
          >
            {busy ? 'Reading the file…' : 'Choose a CSV file'}
          </label>
        </div>
        <p className="type-caption">or drag it here. Up to 500 KB and 1,000 rows.</p>
        <a
          href={SAMPLE_CSV_URL}
          download
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary underline underline-offset-2 transition-colors"
        >
          <Download size={12} aria-hidden="true" />
          Download sample CSV
        </a>
      </div>

      <details className="group border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm text-muted hover:text-primary transition-colors">
          Or paste cells from a spreadsheet
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <label htmlFor="hangar-paste" className={LABEL_CLASS}>
            Cells, with the header row
          </label>
          <textarea
            id="hangar-paste"
            rows={6}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            className={`${INPUT_CLASS} resize-y`}
            placeholder={'phase\tgroup\tlabel\taction\ttier\tinfo'}
          />
          <button
            type="button"
            disabled={busy || pasted.trim() === ''}
            onClick={() => void convert(pasted, null)}
            className="border border-accent text-accent hover:bg-accent hover:text-inverted px-6 py-2.5 font-bold text-xs uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview
          </button>
        </div>
      </details>
    </div>
  );
};

export default ImportPanel;
