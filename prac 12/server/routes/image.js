import { Router } from 'express';
import { STYLES, ASPECTS, STYLE_IDS, ASPECT_IDS } from '../lib/styles.js';
import {
  generateImage, defaultProvider, availableProviders,
  enhanceTextOpenAI, openaiEnhanceModel,
} from '../lib/imageProviders.js';
import { captionImage, enhanceTextGemini, captionAvailable, geminiModel } from '../lib/gemini.js';
import { enhanceLocal } from '../lib/enhanceLocal.js';
import {
  validateGenerate, validateEnhance, validateCaption,
} from '../lib/validate.js';
import { tryConsume } from '../lib/rateLimit.js';

const router = Router();

// GET /api/image/config
router.get('/config', (req, res) => {
  const providers = availableProviders();
  const def = defaultProvider();
  let enhanceSource = 'local';
  if (process.env.GEMINI_API_KEY) enhanceSource = 'gemini';
  else if (process.env.OPENAI_API_KEY) enhanceSource = 'openai';

  res.json({
    defaultProvider: def,
    availableProviders: providers,
    captionAvailable: captionAvailable(),
    enhanceSource,
    styles: STYLE_IDS.map((id) => ({ id, label: STYLES[id].label, suffix: STYLES[id].suffix })),
    aspects: ASPECT_IDS.map((id) => ({ id, label: ASPECTS[id].label, width: ASPECTS[id].width, height: ASPECTS[id].height })),
  });
});

// POST /api/image/generate
router.post('/generate', async (req, res) => {
  const details = validateGenerate(req.body);
  if (details) {
    return res.status(400).json({ error: 'Validation failed', details });
  }

  const { prompt, style = 'photoreal', aspect = 'square', seed, provider } = req.body;
  const requestedProvider = provider || defaultProvider();

  // Rate limit OpenAI calls to 5/min.
  if (requestedProvider === 'openai') {
    if (!tryConsume('openai-images', 5)) {
      return res.status(429).json({ error: 'Too many OpenAI image requests this minute (limit 5). Please wait and try again.', provider: 'openai' });
    }
  }

  try {
    const result = await generateImage({ prompt: prompt.trim(), style, aspect, seed, provider: requestedProvider });
    return res.json(result);
  } catch (e) {
    if (e.status === 400) {
      return res.status(400).json({ error: e.message, details: e.details || { provider: e.message } });
    }
    const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 502;
    return res.status(status).json({ error: e.message || 'Image generation failed.', provider: e.provider || requestedProvider });
  }
});

// POST /api/image/enhance
router.post('/enhance', async (req, res) => {
  const details = validateEnhance(req.body);
  if (details) {
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // Rate limit enhance + caption to 8/min combined.
  if (!tryConsume('ai-text', 8)) {
    return res.status(429).json({ error: 'Too many AI text requests this minute (limit 8). Please wait and try again.' });
  }

  const prompt = req.body.prompt.trim();

  // Gemini first, then OpenAI, then local.
  if (process.env.GEMINI_API_KEY) {
    try {
      const enhanced = await enhanceTextGemini(prompt);
      return res.json({ prompt: enhanced, source: 'gemini', model: geminiModel() });
    } catch (e) {
      // fall through to next provider
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const enhanced = await enhanceTextOpenAI(prompt);
      return res.json({ prompt: enhanced, source: 'openai', model: openaiEnhanceModel() });
    } catch (e) {
      // fall through to local
    }
  }

  const enhanced = enhanceLocal(prompt);
  return res.json({ prompt: enhanced, source: 'local', notice: 'AI enhancement unavailable, used the offline enhancer.' });
});

// POST /api/image/caption
router.post('/caption', async (req, res) => {
  const details = validateCaption(req.body);
  if (details) {
    return res.status(400).json({ error: 'Validation failed', details });
  }

  if (!captionAvailable()) {
    return res.status(503).json({ error: 'Captioning needs GEMINI_API_KEY on the server.' });
  }

  if (!tryConsume('ai-text', 8)) {
    return res.status(429).json({ error: 'Too many AI text requests this minute (limit 8). Please wait and try again.' });
  }

  const { image, mimeType } = req.body;
  try {
    const result = await captionImage(image, mimeType.toLowerCase());
    return res.json({ caption: result.caption, provider: 'gemini', model: result.model });
  } catch (e) {
    const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 502;
    return res.status(status).json({ error: e.message || 'Captioning failed.', provider: 'gemini' });
  }
});

// GET /api/image/download?url=...  (SSRF-safe proxy)
router.get('/download', async (req, res) => {
  const raw = req.query.url;
  if (typeof raw !== 'string' || !raw.startsWith('https://')) {
    return res.status(400).json({ error: 'Only https URLs are allowed.' });
  }
  let url;
  try { url = new URL(raw); } catch {
    return res.status(400).json({ error: 'Invalid URL.' });
  }

  const allowedHosts = [
    'image.pollinations.ai',
    'oaiusercontent.com',
    'files.oaiusercontent.com',
    'api.openai.com',
  ];
  const host = url.hostname.toLowerCase();
  const allowed = allowedHosts.some((h) => host === h || host.endsWith('.' + h));
  if (!allowed) {
    return res.status(400).json({ error: 'Downloads are only allowed from approved image hosts.' });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const upstream = await fetch(url.toString(), { signal: ctrl.signal });
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Could not fetch the image from the provider.' });
    }
    const contentType = (upstream.headers.get('content-type') || '').toLowerCase();
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'The URL did not return an image.' });
    }
    const len = Number(upstream.headers.get('content-length') || 0);
    if (len > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image is larger than 10 MB.' });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image is larger than 10 MB.' });
    }

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('svg') ? 'svg' : 'jpg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="lumora-download.${ext}"`);
    return res.send(buf);
  } catch (e) {
    if (e.name === 'AbortError') {
      return res.status(504).json({ error: 'Download timed out.' });
    }
    return res.status(502).json({ error: 'Could not fetch the image.' });
  } finally {
    clearTimeout(timer);
  }
});

export default router;
