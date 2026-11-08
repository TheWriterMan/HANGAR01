/**
 * Form validation shared by the browser forms and the serverless functions in
 * `api/`. Keep this file free of imports so the API bundle stays small.
 */

/** Length limits, in characters. The server enforces the same values. */
export const LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  subject: { min: 5, max: 150 },
  message: { min: 10, max: 2000 },
  reportDetails: { min: 10, max: 2000 },
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Loose shape check. Expects an already trimmed value. */
export function isValidEmail(email: string): boolean {
  return email.length <= LIMITS.email.max && EMAIL_PATTERN.test(email);
}

// ─── Contact form ────────────────────────────────────────────────────────────

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>;

export function validateContactForm(data: ContactFormData): ContactFormErrors {
  const errors: ContactFormErrors = {};
  const name = data.name.trim();
  const email = data.email.trim();
  const subject = data.subject.trim();
  const message = data.message.trim();

  if (name.length < LIMITS.name.min) errors.name = 'Name must be at least 2 characters.';
  else if (name.length > LIMITS.name.max) errors.name = 'Name must be under 100 characters.';

  if (!isValidEmail(email)) errors.email = 'Please enter a valid email.';

  if (subject.length < LIMITS.subject.min)
    errors.subject = 'Subject must be at least 5 characters.';
  else if (subject.length > LIMITS.subject.max)
    errors.subject = 'Subject must be under 150 characters.';

  if (message.length < LIMITS.message.min)
    errors.message = 'Message must be at least 10 characters.';
  else if (message.length > LIMITS.message.max)
    errors.message = 'Message must be under 2000 characters.';

  return errors;
}

// ─── Checklist report ────────────────────────────────────────────────────────

export interface ReportFormData {
  details: string;
  /** Optional. An empty string means "no follow-up". */
  email: string;
}

export type ReportFormErrors = Partial<Record<keyof ReportFormData, string>>;

export function validateReportForm(data: ReportFormData): ReportFormErrors {
  const errors: ReportFormErrors = {};
  const details = data.details.trim();
  const email = data.email.trim();

  if (details.length < LIMITS.reportDetails.min)
    errors.details = 'Please provide a bit more detail.';
  else if (details.length > LIMITS.reportDetails.max)
    errors.details = 'Please keep details under 2000 characters.';

  if (email && !isValidEmail(email)) errors.email = 'Please enter a valid email or leave it blank.';

  return errors;
}
