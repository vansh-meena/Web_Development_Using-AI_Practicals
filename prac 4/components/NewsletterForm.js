'use client';

import { useRef, useState } from 'react';
import { validateNewsletter } from '../lib/validation';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateNewsletter(email);
    setError(result.errors.email || '');
    setSuccess(false);
    if (!result.isValid) {
      inputRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setSuccess(true);
    setEmail('');
    window.setTimeout(() => setSubmitting(false), 1100);
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
      <label className="sr-only" htmlFor="newsletter-email">Email address</label>
      <div className="newsletter-input-row">
        <input ref={inputRef} id="newsletter-email" name="newsletter-email" type="email" placeholder="Your email address" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); setSuccess(false); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'newsletter-email-error' : undefined} />
        <button className="newsletter-button" type="submit" disabled={submitting} aria-label="Subscribe to newsletter">→</button>
      </div>
      {error && <p className="form-error form-error-light" id="newsletter-email-error" role="alert">{error}</p>}
      {success && <p className="form-success form-success-light" role="status">You&apos;re on the list. Thank you.</p>}
    </form>
  );
}
