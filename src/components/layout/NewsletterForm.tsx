import React, { useState } from 'react';
import { Send } from 'lucide-react';

const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    setSubscribeStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter Subscriber',
          email: email.trim(),
          subject: 'Newsletter Signup',
          message: `New email subscriber: ${email.trim()}`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSubscribeStatus('success');
        setEmail('');
      } else {
        setSubscribeStatus('error');
      }
    } catch {
      setSubscribeStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-primary">Stay updated</h2>

      <p className="type-body text-muted">New aircraft and features. No spam.</p>

      {subscribeStatus === 'success' ? (
        <p className="py-3 text-sm text-success" role="status" aria-live="polite">
          Subscribed.
        </p>
      ) : (
        <form onSubmit={handleSubscribe} className="flex gap-0 mt-3">
          <label htmlFor="footer-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            required
            className="flex-1 border border-border border-r-0 px-3 py-2.5 text-sm text-primary placeholder:text-faint focus:border-accent transition-colors"
          />
          <button
            type="submit"
            disabled={subscribeStatus === 'submitting'}
            aria-label="Subscribe"
            className="border border-border px-4 py-2.5 text-sm text-muted hover:text-primary hover:border-muted transition-colors disabled:opacity-50 flex items-center"
          >
            <Send size={14} aria-hidden="true" />
          </button>
        </form>
      )}

      {subscribeStatus === 'error' && (
        <p role="alert" className="text-sm text-danger">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  );
};

export default NewsletterForm;
