// Request validation. Reports all failing fields at once in a details map.

import { STYLES, ASPECTS, PROVIDERS } from './styles.js';

const SEED_MIN = 0;
const SEED_MAX = 999_999_999;

export function validateGenerate(body) {
  const details = {};
  const prompt = body?.prompt;
  if (typeof prompt !== 'string') {
    details.prompt = 'Prompt is required.';
  } else {
    const trimmed = prompt.trim();
    if (trimmed.length < 3) details.prompt = 'Prompt must be at least 3 characters.';
    else if (trimmed.length > 1000) details.prompt = 'Prompt must be at most 1000 characters.';
  }

  const style = body?.style ?? 'photoreal';
  if (!STYLES[style]) details.style = `Style must be one of: ${Object.keys(STYLES).join(', ')}.`;

  const aspect = body?.aspect ?? 'square';
  if (!ASPECTS[aspect]) details.aspect = `Aspect must be one of: ${Object.keys(ASPECTS).join(', ')}.`;

  if (body?.provider !== undefined) {
    if (!PROVIDERS.includes(body.provider)) {
      details.provider = `Provider must be one of: ${PROVIDERS.join(', ')}.`;
    }
  }

  if (body?.seed !== undefined && body?.seed !== null && body?.seed !== '') {
    const s = Number(body.seed);
    if (!Number.isInteger(s) || s < SEED_MIN || s > SEED_MAX) {
      details.seed = `Seed must be an integer between ${SEED_MIN} and ${SEED_MAX}.`;
    }
  }

  return Object.keys(details).length ? details : null;
}

export function validateEnhance(body) {
  const details = {};
  const prompt = body?.prompt;
  if (typeof prompt !== 'string') {
    details.prompt = 'Prompt is required.';
  } else {
    const trimmed = prompt.trim();
    if (trimmed.length < 3) details.prompt = 'Prompt must be at least 3 characters.';
    else if (trimmed.length > 1000) details.prompt = 'Prompt must be at most 1000 characters.';
  }
  return Object.keys(details).length ? details : null;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DECODED = 4 * 1024 * 1024; // 4 MB
const DATA_URL_RE = /^data:(image\/[a-z]+);base64,(.+)$/i;

export function validateCaption(body) {
  const details = {};
  const image = body?.image;
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    details.image = 'Image must be a data URL starting with "data:image/".';
    return Object.keys(details).length ? details : null;
  }

  const match = image.match(DATA_URL_RE);
  if (!match) {
    details.image = 'Image data URL is malformed.';
    return Object.keys(details).length ? details : null;
  }

  const urlMime = match[1].toLowerCase();
  const b64 = match[2];

  const mimeType = body?.mimeType;
  if (typeof mimeType !== 'string' || !ALLOWED_MIME.includes(mimeType.toLowerCase())) {
    details.mimeType = `mimeType must be one of: ${ALLOWED_MIME.join(', ')}.`;
  } else if (urlMime !== mimeType.toLowerCase()) {
    details.mimeType = `mimeType (${mimeType}) does not match the type in the data URL (${urlMime}).`;
  }

  // Validate base64 and decoded size.
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64) || b64.length % 4 !== 0) {
    details.image = 'Image base64 is not valid.';
  } else {
    // Approximate decoded byte length: floor(len*3/4) minus padding.
    const padding = (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
    const decodedLen = Math.floor(b64.length * 3 / 4) - padding;
    if (decodedLen > MAX_DECODED) {
      details.image = 'Image must be at most 4 MB after decoding.';
    }
  }

  return Object.keys(details).length ? details : null;
}
