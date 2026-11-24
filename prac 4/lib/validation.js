// Returns an error when a text value is empty after trimming.
export function validateRequired(value, fieldName) {
  return String(value ?? '').trim() ? '' : `${fieldName} is required.`;
}

// Returns an error when an email does not use a standard name@domain format.
export function validateEmail(value) {
  if (!String(value ?? '').trim()) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim()) ? '' : 'Enter a valid email address.';
}

// Allows an optional plus sign, spaces, and dashes with 7 to 15 digits.
export function validatePhone(value) {
  const phone = String(value ?? '').trim();
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return /^\+?[\d\s-]+$/.test(phone) && digits.length >= 7 && digits.length <= 15 ? '' : 'Enter a valid phone number.';
}

// Requires a message between 20 and 1000 characters.
export function validateMessage(value) {
  const message = String(value ?? '').trim();
  if (!message) return 'Message is required.';
  if (message.length < 20) return 'Message must be at least 20 characters.';
  if (message.length > 1000) return 'Message must be 1000 characters or fewer.';
  return '';
}

// Validates every contact field and returns the first field that needs attention.
export function validateContactForm(values) {
  const errors = {
    name: validateRequired(values.name, 'Name'),
    email: validateRequired(values.email, 'Email') || validateEmail(values.email),
    phone: validatePhone(values.phone),
    subject: validateRequired(values.subject, 'Subject'),
    message: validateMessage(values.message),
  };
  const firstInvalidField = Object.keys(errors).find((field) => errors[field]) || null;
  return { isValid: !firstInvalidField, errors, firstInvalidField };
}

// Validates a newsletter email for presence and email format.
export function validateNewsletter(email) {
  const requiredError = validateRequired(email, 'Email');
  const errors = requiredError ? { email: requiredError } : { email: validateEmail(email) };
  return { isValid: !errors.email, errors };
}
