import { Router } from 'express';
import { generateContent, resolveProvider } from '../lib/ai.js';
import { validateBody } from '../lib/validate.js';
import { TYPES, TONES, LENGTHS } from '../lib/formatGuides.js';
import { getOpenAIModel, getGeminiModel } from '../lib/constants.js';
import { rateLimiter } from '../lib/rateLimiter.js';

const router = Router();

router.post('/generate', async (req, res) => {
  const { valid, details, normalized } = validateBody(req.body);
  if (!valid) {
    return res.status(400).json({ error: 'Validation failed', details });
  }

  const { provider: resolvedProvider } = resolveProvider(normalized.provider);
  const isDemo = resolvedProvider === 'demo';

  if (!isDemo && !rateLimiter()) {
    return res.status(429).json({ error: 'Too many requests. Wait a few seconds and try again.' });
  }

  try {
    const result = await generateContent(normalized);
    return res.json(result);
  } catch (e) {
    const message = e?.message || 'The content provider failed to respond.';
    return res.status(502).json({ error: message, provider: resolvedProvider });
  }
});

router.get('/config', (req, res) => {
  const { provider, notice } = resolveProvider(null);
  const isDemo = provider === 'demo';
  const model = isDemo ? 'demo' : provider === 'openai' ? getOpenAIModel() : getGeminiModel();
  const availableProviders = ['demo'];
  if (process.env.OPENAI_API_KEY) availableProviders.push('openai');
  if (process.env.GEMINI_API_KEY) availableProviders.push('gemini');

  return res.json({
    provider,
    model,
    demo: isDemo,
    notice: notice || null,
    availableProviders,
    types: TYPES,
    tones: TONES,
    lengths: LENGTHS,
  });
});

export default router;
