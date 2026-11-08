import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ContactSuccessStateProps {
  onReset: () => void;
}

const ContactSuccessState: React.FC<ContactSuccessStateProps> = ({ onReset }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-20">
      <CheckCircle2 size={56} aria-hidden="true" className="text-success mb-6" />
      <h3 className="type-heading text-primary mb-2">Message received</h3>
      <p className="text-muted type-body mb-8 max-w-sm">
        Thanks for reaching out. We'll get back to you within 24 hours.
      </p>
      <button
        onClick={onReset}
        className="text-accent text-sm hover:text-primary underline underline-offset-4 transition-colors"
      >
        Send another message
      </button>
    </div>
  );
};

export default ContactSuccessState;
