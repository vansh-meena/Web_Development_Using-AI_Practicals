'use client';

import { useRef, useState } from 'react';
import { validateContactForm } from '../lib/validation';

const initialValues = { name: '', email: '', phone: '', subject: '', message: '' };

const fields = [
  { name: 'name', label: 'Name', type: 'text', placeholder: 'Your name', required: true },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 212 555 0184' },
];

export default function ContactForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fieldRefs = useRef({});

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSuccess(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateContactForm(values);
    setErrors(result.errors);
    setSuccess(false);
    if (!result.isValid) {
      fieldRefs.current[result.firstInvalidField]?.focus();
      return;
    }
    setSubmitting(true);
    setSuccess(true);
    setValues(initialValues);
    setErrors({});
    window.setTimeout(() => setSubmitting(false), 1200);
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-heading"><p className="eyebrow">Send a note</p><h2>Let&apos;s talk about your next chapter.</h2><p>Tell us a little about what you have in mind. The more context, the better.</p></div>
      <div className="form-grid">
        {fields.map((field) => <div className="field" key={field.name}><label htmlFor={field.name}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label><input ref={(element) => { fieldRefs.current[field.name] = element; }} id={field.name} name={field.name} type={field.type} placeholder={field.placeholder} value={values[field.name]} onChange={(event) => updateField(field.name, event.target.value)} aria-invalid={Boolean(errors[field.name])} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} />{errors[field.name] && <p className="form-error" id={`${field.name}-error`} role="alert">{errors[field.name]}</p>}</div>)}
        <div className="field field-full"><label htmlFor="subject">What can we help with? <span aria-hidden="true">*</span></label><select ref={(element) => { fieldRefs.current.subject = element; }} id="subject" name="subject" value={values.subject} onChange={(event) => updateField('subject', event.target.value)} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'subject-error' : undefined}><option value="">Select a subject</option><option value="brand">Brand strategy or identity</option><option value="website">Website or digital product</option><option value="campaign">Campaign or launch</option><option value="partnership">Something else / a partnership</option></select>{errors.subject && <p className="form-error" id="subject-error" role="alert">{errors.subject}</p>}</div>
        <div className="field field-full"><label htmlFor="message">Tell us more <span aria-hidden="true">*</span></label><textarea ref={(element) => { fieldRefs.current.message = element; }} id="message" name="message" rows="6" maxLength="1000" placeholder="A few words about the challenge, the opportunity, or the dream..." value={values.message} onChange={(event) => updateField('message', event.target.value)} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : 'message-count'} />{errors.message && <p className="form-error" id="message-error" role="alert">{errors.message}</p>}<p className="character-count" id="message-count">{values.message.length} / 1000</p></div>
      </div>
      {success && <p className="form-success" role="status">Thanks for reaching out. We&apos;ll be in touch within two business days.</p>}
      <button className="button button-primary submit-button" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send enquiry'} <span aria-hidden="true">↗</span></button>
    </form>
  );
}
