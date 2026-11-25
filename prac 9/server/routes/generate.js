import { Router } from 'express';
import { validateGenerateRequest } from '../lib/validate.js';
import { generateText, getProviderConfig } from '../lib/ai.js';
import { LIMITS, MODES, PROVIDERS } from '../lib/constants.js';

const router = Router();

function safeError(err) {
  let message = 'Something went wrong while generating text.';
  if (err.kind === 'timeout') {
    message = 'The AI provider took too long to respond (30 second timeout). Try again.';
  } else if (err.kind === 'network') {
    message = 'Could not reach the AI provider. Check your network connection.';
  } else if (err instanceof Error && err.message) {
    message = err.message;
  }
  return message;
}

router.post('/generate', async (req, res) => {
  const { errors, values } = validateGenerateRequest(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  try {
    const result = await generateText({
      prompt: values.prompt,
      mode: values.mode,
      provider: values.provider,
      maxTokens: values.maxTokens,
    });
    return res.json(result);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[generate] provider error: ${err.kind ?? 'upstream'} (status: ${err.status ?? 'n/a'})`);
    }
    return res.status(502).json({ error: safeError(err), provider: err.provider ?? 'unknown' });
  }
});

router.get('/generate/config', (req, res) => {
  const cfg = getProviderConfig();
  res.json({
    provider: cfg.provider,
    model: cfg.model,
    demo: cfg.demo,
    notice: cfg.notice,
    availableProviders: cfg.availableProviders,
    modes: MODES,
    providers: PROVIDERS,
    limits: LIMITS,
  });
});

export default router;
