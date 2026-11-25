import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { ProviderError, generateReply, getConfig } from '../lib/ai.js';
import { appendMessages, deleteSession, getHistory, isValidId } from '../lib/sessions.js';

const router = Router();
const VALID_PROVIDERS = ['openai', 'gemini', 'demo'];
const MAX_MESSAGE_LENGTH = 2000;

router.post('/', async (req, res) => {
  const body = req.body ?? {};
  const { message, sessionId, provider } = body;

  const details = {};
  if (typeof message !== 'string' || message.trim().length === 0) {
    details.message = 'Please enter a message.';
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    details.message = `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
  }
  if (provider !== undefined && !VALID_PROVIDERS.includes(provider)) {
    details.provider = 'Provider must be one of: openai, gemini, demo.';
  }
  if (
    sessionId !== undefined &&
    (typeof sessionId !== 'string' || sessionId.length < 1 || sessionId.length > 100)
  ) {
    details.sessionId = 'Session ID must be a string of 1-100 characters.';
  }
  if (Object.keys(details).length > 0) {
    res.status(400).json({ error: 'Validation failed', details });
    return;
  }

  const trimmed = message.trim();
  const id =
    typeof sessionId === 'string' && isValidId(sessionId) ? sessionId : randomUUID();
  const history = getHistory(id);

  try {
    const { reply, provider: usedProvider } = await generateReply({
      history,
      message: trimmed,
      provider,
    });
    // Only record the exchange once the reply succeeded, so failed calls
    // never pollute the conversation history.
    appendMessages(id, [
      { role: 'user', content: trimmed },
      { role: 'assistant', content: reply },
    ]);
    res.json({ reply, sessionId: id, provider: usedProvider, demo: usedProvider === 'demo' });
  } catch (err) {
    if (err instanceof ProviderError) {
      res.status(502).json({ error: err.message, provider: err.provider });
    } else {
      console.error('Chat handler error:', err?.message || err);
      res.status(502).json({
        error: 'We could not get an answer from the assistant. Please try again.',
        provider: 'unknown',
      });
    }
  }
});

router.delete('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (isValidId(sessionId)) {
    deleteSession(sessionId);
  }
  res.status(204).end();
});

router.get('/config', (_req, res) => {
  res.json(getConfig());
});

export default router;
