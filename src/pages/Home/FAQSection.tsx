import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Accordion from '../../components/ui/Accordion';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const faqItems: FAQItem[] = [
  {
    question: 'Is HANGAR01 free?',
    answer: (
      <p>
        Yes — completely free, and it always will be. No paywalls, no premium tiers, no ads. This is
        a community tool built for simmers.
      </p>
    ),
  },
  {
    question: 'How can I contribute?',
    answer: (
      <p>
        The app will be open-sourced soon. In the meantime, you can contribute by flagging incorrect
        checklist items using the Report button on any checklist, reporting bugs, and sharing
        feedback via the{' '}
        <Link to="/contact" className="prose-link">
          contact form
        </Link>
        .
      </p>
    ),
  },
  {
    question: 'Can I request an aircraft checklist?',
    answer: (
      <p>
        Absolutely. Drop a message through the{' '}
        <Link to="/contact" className="prose-link">
          contact page
        </Link>{' '}
        with the aircraft you'd like to see — it goes straight onto the list.
      </p>
    ),
  },
  {
    question: 'Can I request a feature?',
    answer: (
      <p>
        Yes — feature requests are welcome. Use the{' '}
        <Link to="/contact" className="prose-link">
          contact form
        </Link>{' '}
        and describe what you have in mind. Every suggestion is reviewed.
      </p>
    ),
  },
  {
    question: 'What features are coming next?',
    answer: (
      <p>
        More aircraft, improved mobile experience, and community features are all in progress. Use
        the{' '}
        <Link to="/contact" className="prose-link">
          contact form
        </Link>{' '}
        to suggest what you'd like to see next.
      </p>
    ),
  },
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="border-t border-border bg-base">
      <div className="container-page py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          {/* Left — heading & description */}
          <div className="md:sticky md:top-24 self-start">
            <h2 className="type-title text-primary mb-3">Frequently Asked</h2>
            <p className="text-muted type-body max-w-sm">
              Quick answers to common questions about HANGAR01, contributing, and what's coming
              next.
            </p>
          </div>

          {/* Right — accordion */}
          <div className="border-t border-border">
            {faqItems.map((item, i) => (
              <Accordion
                key={i}
                id={`faq-${i}`}
                title={item.question}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              >
                {item.answer}
              </Accordion>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
