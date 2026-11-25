// Central location for default provider models. Override with env vars.
export const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
};

export const TIMEOUT_MS = 30000;

export const MODES = ['freeform', 'summarize', 'rewrite', 'brainstorm', 'explain'];

export const PROVIDERS = ['openai', 'gemini', 'demo'];

export const LIMITS = {
  promptMin: 4,
  promptMax: 4000,
  maxTokensMin: 50,
  maxTokensMax: 1000,
  maxTokensDefault: 300,
};
