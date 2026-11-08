import type { VercelRequest, VercelResponse } from '@vercel/node';
// `.js` specifiers: Vercel runs these functions as native ESM.
import { createRateLimiter, handleSubmission, str } from './_lib/submission.js';
import { validateContactForm, type ContactFormData } from '../src/utils/validation.js';

const limiter = createRateLimiter(30_000);

function validate(body: Record<string, unknown>): { data: ContactFormData } | { error: string } {
  const data: ContactFormData = {
    name: str(body.name).trim(),
    email: str(body.email).trim(),
    subject: str(body.subject).trim(),
    message: str(body.message).trim(),
  };
  const errors = validateContactForm(data);
  const first = errors.name ?? errors.email ?? errors.subject ?? errors.message;
  return first ? { error: first } : { data };
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleSubmission(req, res, {
    webhookEnv: 'DISCORD_CONTACT_WEBHOOK_URL',
    limiter,
    validate,
    failureMessage: 'Failed to send your message. Please try again.',
    toEmbed: (data) => ({
      title: '📬 New Contact Submission',
      color: 5814783,
      description: data.message,
      fields: [
        { name: 'From', value: data.name, inline: true },
        { name: 'Email', value: data.email, inline: true },
        { name: 'Subject', value: data.subject },
      ],
    }),
  });
}
