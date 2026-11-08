import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import TextSection from '../../components/layout/TextSection';
import SEO from '../../components/seo/SEO';
import { getAircraftList } from '../../services/aircraft';

/**
 * Who makes HANGAR01, how the checklists work and how corrections are made. Search engines
 * and visitors look for who is behind a page.
 */
const AboutPage: React.FC = () => {
  const count = getAircraftList().filter((ac) => ac.status !== 'draft').length;

  return (
    <div className="min-h-screen bg-base pb-24">
      <SEO
        title="About HANGAR01"
        description={`HANGAR01 is a free library of interactive checklists for ${count} MSFS aircraft, made by one flight simmer. How the checklists work, and how to get one corrected.`}
        path="/about"
      />
      <div className="container-content pt-8 md:pt-16">
        <PageHeader
          title="ABOUT"
          subtitle={`Free interactive checklists for ${count} aircraft in Microsoft Flight Simulator (MSFS), from the default Cessna 172 to PMDG's 737 and 777.`}
          backLink={{ to: '/', label: 'Return home' }}
        />

        <TextSection title="What HANGAR01 is">
          <p>
            HANGAR01 is a library of checklists you tick off as you fly. Each one is written for one
            aircraft in MSFS, the default ones and add-ons alike, and the add-on is named on its
            page. It runs in the browser on a phone, tablet or second screen, with no account and no
            ads.
          </p>
          <p>
            <Link to="/aircraft">See all {count} aircraft</Link>.
          </p>
        </TextSection>

        <TextSection title="How the checklists work">
          <p>
            Each checklist runs through the phases of a flight, such as preflight, engine start,
            takeoff, cruise and landing, with the items for each phase grouped by flow. Many items
            have a short note on what the control does and where to find it, behind the info button
            next to the item.
          </p>
          <p>
            You choose how deep to go. Quick has the minimum items to fly the sim. Normal adds the
            standard day-to-day procedures. Full adds every extended procedure and real-world
            airmanship item. Your ticks and your mode are saved on your device for each aircraft, so
            you can close the tab and pick up where you left off.
          </p>
          <p>
            Any checklist can be printed or saved as a PDF from the button under the list, in the
            mode you have chosen.
          </p>
        </TextSection>

        <TextSection title="Who makes it">
          <p>
            HANGAR01 is made by{' '}
            <a href="https://thewriterman.com" target="_blank" rel="noopener noreferrer">
              one flight simmer
            </a>{' '}
            as a free side project. It began as SimCheck, an early version with three aircraft
            shared on Reddit, and relaunched as HANGAR01 in May 2026. The{' '}
            <Link to="/news/hangar01-v1-is-live">launch post</Link> tells the story.
          </p>
        </TextSection>

        <TextSection title="Corrections">
          <p>
            With thousands of items, some will be wrong, missing or out of date, especially after an
            add-on update. Every checklist page has a Report Inaccuracy button. Reports go straight
            to the maker, and corrections ship in the next update and are listed in the{' '}
            <Link to="/changelog">changelog</Link>. Each checklist shows the date it last changed.
          </p>
          <p>
            For anything else, use the <Link to="/contact">contact page</Link>.
          </p>
        </TextSection>

        <TextSection title="For simulation only">
          <p>
            HANGAR01 is for flight simulation. Its checklists are not approved for real aircraft and
            must never be used for real-world flying.
          </p>
        </TextSection>

        <TextSection title="Licence">
          <p>
            The checklists and posts are free to share and adapt under the{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Creative Commons Attribution 4.0 licence
            </a>
            , as long as you credit HANGAR01 and link back to hangar01.space. See the{' '}
            <Link to="/privacy">privacy page</Link> for what the site stores and sends.
          </p>
        </TextSection>
      </div>
    </div>
  );
};

export default AboutPage;
