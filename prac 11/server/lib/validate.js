import { TYPES, TONES, LENGTHS, PROVIDERS } from './formatGuides.js';

export function validateBody(body) {
  const details = {};

  const type = body?.type;
  if (!TYPES.includes(type)) {
    details.type = `type is required and must be one of ${TYPES.join(', ')}.`;
  }

  const tone = body?.tone;
  if (!TONES.includes(tone)) {
    details.tone = `tone is required and must be one of ${TONES.join(', ')}.`;
  }

  const length = body?.length;
  if (!LENGTHS.includes(length)) {
    details.length = `length is required and must be one of ${LENGTHS.join(', ')}.`;
  }

  const topic = typeof body?.topic === 'string' ? body.topic.trim() : '';
  if (topic.length < 3 || topic.length > 1000) {
    details.topic = 'topic is required and must be 3 to 1000 characters after trim.';
  }

  const keyPoints = body?.keyPoints;
  if (keyPoints !== undefined && keyPoints !== null && keyPoints !== '') {
    if (typeof keyPoints !== 'string') {
      details.keyPoints = 'keyPoints must be a string.';
    } else if (keyPoints.length > 1500) {
      details.keyPoints = 'keyPoints must be at most 1500 characters.';
    }
  }

  const provider = body?.provider;
  if (provider !== undefined && provider !== null && provider !== '') {
    if (!PROVIDERS.includes(provider)) {
      details.provider = `provider must be one of ${PROVIDERS.join(', ')}.`;
    }
  }

  const refresh = body?.refresh;
  if (refresh !== undefined && refresh !== null && typeof refresh !== 'boolean') {
    details.refresh = 'refresh must be a boolean.';
  }

  return { valid: Object.keys(details).length === 0, details, normalized: { type, tone, length, topic, keyPoints: keyPoints || '', provider: provider || '', refresh: refresh === true } };
}
