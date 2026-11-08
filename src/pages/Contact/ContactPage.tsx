import React from 'react';
import { MessageSquare } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import SEO from '../../components/seo/SEO';
import ContactForm from './ContactForm';

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-base pb-20">
      <SEO
        title="Contact"
        description="Contact the HANGAR01 team with a question, a feature request, a checklist you'd like to see added, or a bug you found in an existing checklist."
        path="/contact"
      />
      <div className="container-page pt-8 md:pt-16">
        <PageHeader
          title="CONTACT"
          subtitle="Got a question, feature request, or spotted a bug? Drop us a message."
          backLink={{ to: '/', label: 'Return home' }}
          icon={MessageSquare}
          iconClassName="text-accent"
        />

        <p className="type-body text-muted -mt-6 mb-10 max-w-2xl animate-fade-up">
          HANGAR01 is a free community project with minor hosting and development costs. If you're
          interested in sponsoring or helping keep things running, feel free to reach out below.
        </p>

        <div
          className="bg-surface/20 border border-border p-6 md:p-8 animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          <ContactForm />
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
