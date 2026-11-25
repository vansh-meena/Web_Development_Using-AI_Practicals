const LIMITS = {
  promptMin: 4,
  promptMax: 4000,
  maxTokensMin: 50,
  maxTokensMax: 1000,
  maxTokensDefault: 300,
};

const MODE_LABELS = {
  freeform: 'Freeform',
  summarize: 'Summarize',
  rewrite: 'Rewrite',
  brainstorm: 'Brainstorm',
  explain: 'Explain',
};

const PROVIDER_LABELS = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  demo: 'Demo',
};

export { LIMITS, MODE_LABELS, PROVIDER_LABELS };
