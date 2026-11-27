const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY = 10 * 1024; // 10 KB
const MAX_NAME = 80;
const MAX_NOTE = 500;
const ALLOWED_KEYS = new Set(['name', 'email', 'note']);

function isString(v) {
  return typeof v === 'string';
}

function containsHtml(s) {
  return s.includes('<') || s.includes('>');
}

function validateRecord(body) {
  const details = {};

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, details: { body: 'Expected a JSON object' } };
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_KEYS.has(key)) {
      details[key] = 'Unexpected field';
    }
  }
  if (Object.keys(details).length > 0) {
    return { valid: false, details };
  }

  const { name, email, note } = body;

  if (!isString(name)) {
    details.name = 'name must be a string';
  } else {
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      details.name = 'name must be 1 to 80 characters after trimming';
    } else if (trimmed.length > MAX_NAME) {
      details.name = 'name must be 1 to 80 characters after trimming';
    } else if (containsHtml(name)) {
      details.name = 'name must not contain HTML markup characters';
    }
  }

  if (!isString(email)) {
    details.email = 'email must be a string';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    details.email = 'email is not valid';
  }

  if (note !== undefined) {
    if (!isString(note)) {
      details.note = 'note must be a string';
    } else if (note.length > MAX_NOTE) {
      details.note = 'note must be at most 500 characters';
    } else if (containsHtml(note)) {
      details.note = 'note must not contain HTML markup characters';
    }
  }

  if (Object.keys(details).length > 0) {
    return { valid: false, details };
  }

  return {
    valid: true,
    record: {
      name: name.trim(),
      email: email.trim(),
      note: note !== undefined ? note : null,
    },
  };
}

module.exports = {
  EMAIL_PATTERN,
  MAX_BODY,
  validateRecord,
};
