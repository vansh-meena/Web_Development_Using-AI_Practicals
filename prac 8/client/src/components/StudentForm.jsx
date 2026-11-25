import { useEffect, useState } from 'react';

const COURSES = ['CSE', 'ECE', 'ME', 'CE'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLL_NO_PATTERN = /^[A-Za-z0-9-]{3,20}$/;

const EMPTY_FORM = {
  name: '',
  rollNo: '',
  email: '',
  course: 'CSE',
  year: '1',
  gpa: ''
};

function validate(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = 'Name is required.';
  } else if (form.name.trim().length > 80) {
    errors.name = 'Name must be 80 characters or fewer.';
  }

  if (!form.rollNo.trim()) {
    errors.rollNo = 'Roll number is required.';
  } else if (!ROLL_NO_PATTERN.test(form.rollNo.trim().toUpperCase())) {
    errors.rollNo = 'Use 3-20 letters, numbers, or dashes (e.g. CSE-101).';
  }

  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!COURSES.includes(form.course)) {
    errors.course = 'Choose a course.';
  }

  const year = Number(form.year);
  if (!Number.isInteger(year) || year < 1 || year > 4) {
    errors.year = 'Year must be a whole number from 1 to 4.';
  }

  const gpa = Number(form.gpa);
  if (form.gpa === '' || Number.isNaN(gpa) || gpa < 0 || gpa > 10) {
    errors.gpa = 'GPA must be a number from 0 to 10.';
  }

  return errors;
}

export default function StudentForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        rollNo: initial.rollNo,
        email: initial.email,
        course: initial.course,
        year: String(initial.year),
        gpa: String(initial.gpa)
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setTouched({});
    setSubmitError(null);
  }, [initial]);

  const errors = validate(form);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, rollNo: true, email: true, course: true, year: true, gpa: true });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit({
        name: form.name.trim(),
        rollNo: form.rollNo.trim().toUpperCase(),
        email: form.email.trim().toLowerCase(),
        course: form.course,
        year: Number(form.year),
        gpa: Number(form.gpa)
      });
    } catch (err) {
      setSubmitError(err.details ? `${err.message} ${err.details.join(' ')}` : err.message);
    } finally {
      setSaving(false);
    }
  }

  const showError = (field) => (touched[field] ? errors[field] || '' : '');

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={initial ? 'Edit student' : 'Add student'}>
        <h2>{initial ? 'Edit student' : 'Add student'}</h2>

        {submitError && <div className="error-banner">{submitError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="sf-name">Name</label>
              <input
                id="sf-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                onBlur={() => markTouched('name')}
                placeholder="e.g. Riya Kapoor"
              />
              <span className="field-error">{showError('name')}</span>
            </div>

            <div className="form-field">
              <label htmlFor="sf-rollno">Roll number</label>
              <input
                id="sf-rollno"
                value={form.rollNo}
                onChange={(e) => setField('rollNo', e.target.value)}
                onBlur={() => markTouched('rollNo')}
                placeholder="e.g. CSE-509"
              />
              <span className="field-error">{showError('rollNo')}</span>
            </div>

            <div className="form-field">
              <label htmlFor="sf-email">Email</label>
              <input
                id="sf-email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                onBlur={() => markTouched('email')}
                placeholder="e.g. riya@example.com"
              />
              <span className="field-error">{showError('email')}</span>
            </div>

            <div className="form-field">
              <label htmlFor="sf-course">Course</label>
              <select
                id="sf-course"
                value={form.course}
                onChange={(e) => setField('course', e.target.value)}
                onBlur={() => markTouched('course')}
              >
                {COURSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span className="field-error">{showError('course')}</span>
            </div>

            <div className="form-field">
              <label htmlFor="sf-year">Year</label>
              <select
                id="sf-year"
                value={form.year}
                onChange={(e) => setField('year', e.target.value)}
                onBlur={() => markTouched('year')}
              >
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="field-error">{showError('year')}</span>
            </div>

            <div className="form-field full">
              <label htmlFor="sf-gpa">GPA (0-10)</label>
              <input
                id="sf-gpa"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={form.gpa}
                onChange={(e) => setField('gpa', e.target.value)}
                onBlur={() => markTouched('gpa')}
                placeholder="e.g. 8.5"
              />
              <span className="field-error">{showError('gpa')}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Add student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
