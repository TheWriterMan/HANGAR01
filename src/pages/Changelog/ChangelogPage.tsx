import React from 'react';
import PageHeader from '../../components/layout/PageHeader';
import SEO from '../../components/seo/SEO';
import changelogRaw from '../../../CHANGELOG.md?raw';
import { parseChangelog } from '../../utils/changelog';
import ChangelogEntry from './ChangelogEntry';

const ChangelogPage: React.FC = () => {
  const entries = parseChangelog(changelogRaw);

  return (
    <div className="min-h-screen bg-base pb-24">
      <SEO
        title="Changelog"
        description="Every HANGAR01 release in one place: new aircraft checklists, corrected procedures, new features and fixes, newest first, with the date each one shipped."
        path="/changelog"
      />
      <div className="container-content pt-8 md:pt-16">
        <PageHeader
          title="CHANGE"
          highlightedText="LOG"
          subtitle="A record of every update shipped to production."
          backLink={{ to: '/', label: 'Return home' }}
        />

        <div className="space-y-10 mt-4">
          {entries.map((entry, idx) => (
            <ChangelogEntry key={entry.heading} entry={entry} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangelogPage;
