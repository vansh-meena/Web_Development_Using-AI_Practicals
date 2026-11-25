import { LIMITS, MODES, PROVIDERS } from './constants.js';

// Returns { errors: {field: message} }. Empty object means valid.
export function validateGenerateRequest(body) {
  const errors = {};
  const data = body && typeof body === 'object' ? body : {};

  const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
  if (!prompt) {
    errors.prompt = 'Prompt is required.';
  } else if (prompt.length < LIMITS.promptMin) {
    errors.prompt = `Prompt must be at least ${LIMITS.promptMin} characters.`;
  } else if (prompt.length > LIMITS.promptMax) {
    errors.prompt = `Prompt must be at most ${LIMITS.promptMax} characters.`;
  }

  const mode = data.mode === undefined || data.mode === null || data.mode === '' ? 'freeform' : data.mode;
  if (!MODES.includes(mode)) {
    errors.mode = `Mode must be one of: ${MODES.join(', ')}.`;
  }

  const provider = data.provider === undefined || data.provider === null || data.provider === '' ? undefined : data.provider;
  if (provider !== undefined && !PROVIDERS.includes(provider)) {
    errors.provider = `Provider must be one of: ${PROVIDERS.join(', ')} or omitted.`;
  }

  let maxTokens = data.maxTokens === undefined || data.maxTokens === null || data.maxTokens === '' ? LIMITS.maxTokensDefault : data.maxTokens;
  if (typeof maxTokens !== 'number' || !Number.isInteger(maxTokens)) {
    errors.maxTokens = 'maxTokens must be an integer.';
  } else if (maxTokens < LIMITS.maxTokensMin || maxTokens > LIMITS.maxTokensMax) {
    errors.maxTokens = `maxTokens must be between ${LIMITS.maxTokensMin} and ${LIMITS.maxTokensMax}.`;
  }

  return { errors, values: { prompt, mode, provider, maxTokens } };
}
