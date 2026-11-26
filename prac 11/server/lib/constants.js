export const PORT = Number(process.env.PORT) || 5004;

export const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash-lite',
};

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || DEFAULT_MODELS.openai;
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_MODELS.gemini;
}
