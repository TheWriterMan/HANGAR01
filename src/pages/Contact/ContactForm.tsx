import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import {
  ContactFormData,
  ContactFormErrors,
  LIMITS,
  validateContactForm,
} from '../../utils/validation';
import ContactSuccessState from './ContactSuccessState';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const fieldRefs: Record<string, React.RefObject<HTMLInputElement | HTMLTextAreaElement>> = {
    name: nameRef as React.RefObject<HTMLInputElement>,
    email: emailRef as React.RefObject<HTMLInputElement>,
    subject: subjectRef as React.RefObject<HTMLInputElement>,
    message: messageRef as React.RefObject<HTMLTextAreaElement>,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validateContactForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorField = Object.keys(validationErrors)[0] as keyof ContactFormErrors;
      fieldRefs[firstErrorField]?.current?.focus();
      return;
    }

    setErrors({});
    setStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, _honeypot: honeypot }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setStatus('success');
      } else {
        setServerError(json.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setServerError('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setErrors({});
    setServerError('');
  };

  if (status === 'success') {
    return <ContactSuccessState onReset={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Honeypot */}
      <div className="absolute opacity-0 z-behind pointer-events-none" aria-hidden="true">
        <input
          type="text"
          name="_honeypot"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-xs uppercase text-muted">
            Name{' '}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            ref={nameRef}
            type="text"
            id="name"
            name="name"
            required
            autoComplete="name"
            maxLength={LIMITS.name.max}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            value={formData.name}
            onChange={handleChange}
            className="w-full bg-base border border-border p-3 text-primary text-sm focus:border-accent transition-colors placeholder:text-faint"
            placeholder="Your name"
          />
          {errors.name && (
            <p id="name-error" role="alert" className="text-danger text-xs">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-xs uppercase text-muted">
            Email{' '}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            ref={emailRef}
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            maxLength={LIMITS.email.max}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-base border border-border p-3 text-primary text-sm focus:border-accent transition-colors placeholder:text-faint"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-danger text-xs">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label htmlFor="subject" className="block text-xs uppercase text-muted">
          Subject{' '}
          <span className="text-danger" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          ref={subjectRef}
          type="text"
          id="subject"
          name="subject"
          required
          maxLength={LIMITS.subject.max}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          value={formData.subject}
          onChange={handleChange}
          className="w-full bg-base border border-border p-3 text-primary text-sm focus:border-accent transition-colors placeholder:text-faint"
          placeholder="Feature request, bug report, question..."
        />
        {errors.subject && (
          <p id="subject-error" role="alert" className="text-danger text-xs">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label htmlFor="message" className="block text-xs uppercase text-muted">
          Message{' '}
          <span className="text-danger" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(required)</span>
        </label>
        <textarea
          ref={messageRef}
          id="message"
          name="message"
          required
          rows={6}
          maxLength={LIMITS.message.max}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
          value={formData.message}
          onChange={handleChange}
          className="w-full bg-base border border-border p-3 text-primary text-sm focus:border-accent transition-colors placeholder:text-faint resize-none"
          placeholder="Tell us what's on your mind..."
        />
        <div className="flex justify-between">
          {errors.message && (
            <p id="message-error" role="alert" className="text-danger text-xs">
              {errors.message}
            </p>
          )}
          <p className="text-faint text-xs ml-auto">
            {formData.message.length}/{LIMITS.message.max}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4 flex items-center justify-between border-t border-border mt-8">
        <div className="text-2xs text-faint uppercase">
          {status === 'submitting' ? 'Sending...' : 'All fields required'}
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="border border-accent text-accent hover:bg-accent hover:text-inverted px-6 py-2.5 font-bold text-xs uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>{status === 'submitting' ? 'Sending' : 'Send'}</span>
          <Send size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Server error */}
      {status === 'error' && serverError && (
        <div role="alert" className="p-3 bg-danger/20 border border-danger text-danger text-xs">
          {serverError}
        </div>
      )}
    </form>
  );
};

export default ContactForm;
