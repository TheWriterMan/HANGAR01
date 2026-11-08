import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import TextSection from '../../components/layout/TextSection';
import SEO from '../../components/seo/SEO';

/** Last substantive change to this page. Update it when what the site stores or sends changes. */
const UPDATED = '8 November 2026';

/**
 * What HANGAR01 stores and sends. The newsletter, contact and report forms collect email
 * addresses. Facts from the code: src/utils/storage.ts and
 * src/utils/progress.ts (on the device), api/contact.ts and api/report.ts (the forms),
 * src/entry-client.tsx (Vercel's scripts).
 */
const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-base pb-24">
      <SEO
        title="Privacy"
        description="What HANGAR01 stores and sends: ticks saved only on your device, cookie-free visit counts, and what you type into the contact, newsletter and report forms."
        path="/privacy"
      />
      <div className="container-content pt-8 md:pt-16">
        <PageHeader
          title="PRIVACY"
          subtitle={`HANGAR01 has no accounts, no ads and no cookies. Updated ${UPDATED}.`}
          backLink={{ to: '/', label: 'Return home' }}
        />

        <TextSection title="On your device">
          <p>
            Your ticks, your chosen mode for each aircraft and your light or dark theme are saved in
            your browser's storage, so a checklist picks up where you left off. They never leave
            your device. A report you are still writing is kept until you close the tab. Clearing
            your browser's site data removes all of it.
          </p>
        </TextSection>

        <TextSection title="Visit counts">
          <p>
            The site is hosted on Vercel. Vercel's analytics count page visits and measure how fast
            pages load, without cookies and without identifying you: the page, where the visit came
            from, the country, and the type of device and browser. Like any web host, Vercel's
            servers also log your IP address to deliver the site.
          </p>
        </TextSection>

        <TextSection title="The forms">
          <p>
            <strong className="text-primary font-medium">Contact and newsletter.</strong> The name,
            email address and message you send go to the maker's private Discord channel, where they
            are read and answered. A newsletter address is used only to send HANGAR01 updates.
          </p>
          <p>
            <strong className="text-primary font-medium">Report Inaccuracy.</strong> Your report is
            checked by an automated spam filter run by Groq. A genuine report becomes an issue in
            HANGAR01's GitHub repository, so other people may see its text. Your email address, if
            you give one, is never published: it goes only to the maker's inbox, through the email
            service Resend, so the maker can reply.
          </p>
        </TextSection>

        <TextSection title="Removing your details">
          <p>
            To have a message, report or newsletter address deleted, write to{' '}
            <a href="mailto:hi@hangar01.space">hi@hangar01.space</a> or use the{' '}
            <Link to="/contact">contact page</Link>.
          </p>
        </TextSection>
      </div>
    </div>
  );
};

export default PrivacyPage;
