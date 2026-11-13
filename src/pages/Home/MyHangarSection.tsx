import React from 'react';
import { Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import LocalChecklistCard from '../../components/ui/LocalChecklistCard';
import { useLocalChecklists } from '../../hooks/useLocalChecklists';
import { SAMPLE_CSV_URL } from '../../utils/checklistCsv';

/**
 * My Hangar on the home page. The prerender and first render show the pitch;
 * once the browser's checklists load, a visitor with some sees the 3 newest.
 */
const MyHangarSection: React.FC = () => {
  const { checklists } = useLocalChecklists();
  const recent = checklists.slice(0, 3);

  return (
    <>
      <section aria-labelledby="my-hangar-heading" className="mb-16">
        <div className="mb-6">
          <p className="text-2xs font-bold uppercase text-accent mb-1">Your Own Checklists</p>
          <h2 id="my-hangar-heading" className="type-title text-primary">
            My Hangar
          </h2>
        </div>

        {recent.length === 0 ? (
          <div className="border border-border bg-surface/20 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <p className="type-body text-muted max-w-xl">
              Turn a spreadsheet into a checklist you can tick off as you fly. Write one row per
              item, import the CSV, and it's saved in your browser.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={SAMPLE_CSV_URL}
                download
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-border text-primary hover:border-muted transition-colors duration-base"
              >
                <Download size={14} aria-hidden="true" className="opacity-60" />
                Download sample CSV
              </a>
              <Button to="/hangar#import" label="Import CSV" variant="primary" />
            </div>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {recent.map((checklist) => (
                <li key={checklist.id}>
                  <LocalChecklistCard checklist={checklist} />
                </li>
              ))}
            </ul>
            <div className="flex justify-center">
              <Button to="/hangar" label="Open My Hangar" variant="outline" />
            </div>
          </>
        )}
      </section>

      <div className="border-t border-border mb-16" />
    </>
  );
};

export default MyHangarSection;
