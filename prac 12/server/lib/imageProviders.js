// Image generation providers: pollinations, openai, demo.
// Exactly one provider call per generation. No automatic retries.

import { STYLES, ASPECTS, OPENAI_SIZE_MAP, buildFinalPrompt } from './styles.js';
import { demoSvg } from './demoSvg.js';

const POLLINATIONS_BASE = () => process.env.POLLINATIONS_BASE_URL || 'https://image.pollinations.ai/prompt/';
const OPENAI_KEY = () => process.env.OPENAI_API_KEY || '';
const OPENAI_IMAGE_MODEL = () => process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

const MAX_PROMPT_LEN = 1500;

function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

// --- Pollinations ---
// The server only BUILDS a URL; the browser fetches the image.
export function pollinationsGenerate({ prompt, style, aspect, seed }) {
  const finalPrompt = buildFinalPrompt(prompt, style);
  const capped = finalPrompt.slice(0, MAX_PROMPT_LEN);
  const dim = ASPECTS[aspect] || ASPECTS.square;
  const useSeed = seed !== undefined && seed !== null && seed !== '' ? Number(seed) : randomSeed();
  const url = `${POLLINATIONS_BASE()}${encodeURIComponent(capped)}?width=${dim.width}&height=${dim.height}&seed=${useSeed}&nologo=true`;
  return {
    url,
    seed: useSeed,
    provider: 'pollinations',
    model: 'pollinations',
    demo: false,
    style,
    aspect,
    width: dim.width,
    height: dim.height,
    finalPrompt: capped,
    seedSupported: true,
    downloadable: true,
  };
}

// --- Demo ---
export function demoGenerate({ prompt, style, aspect, seed }) {
  const useSeed = seed !== undefined && seed !== null && seed !== '' ? Number(seed) : randomSeed();
  const dim = ASPECTS[aspect] || ASPECTS.square;
  const finalPrompt = buildFinalPrompt(prompt, style);
  const url = demoSvg(prompt, style, useSeed, aspect);
  return {
    url,
    seed: useSeed,
    provider: 'demo',
    model: 'demo',
    demo: true,
    style,
    aspect,
    width: dim.width,
    height: dim.height,
    finalPrompt,
    seedSupported: true,
    downloadable: true,
  };
}

// --- OpenAI ---
function mapOpenAIError(status, body) {
  if (status === 401 || status === 403) return 'OpenAI API key is invalid or your account does not have access to this image model.';
  if (status === 429) return 'OpenAI rate limit or quota reached. Try again later.';
  if (status === 400) {
    const msg = body?.error?.message || '';
    if (/content policy|safety|blocked|filtered/i.test(msg)) {
      return 'This prompt was rejected by the provider\'s safety system. Try rewording it.';
    }
    return `OpenAI rejected the request: ${msg || 'bad request'}`;
  }
  if (status >= 500) return 'OpenAI service is temporarily unavailable.';
  const msg = body?.error?.message;
  if (msg) return `OpenAI request failed: ${msg}`;
  return 'OpenAI request failed.';
}

export async function openaiGenerate({ prompt, style, aspect, seed }) {
  const key = OPENAI_KEY();
  if (!key) {
    const err = new Error('OpenAI key not configured');
    err.status = 400;
    err.provider = 'OpenAI key not configured';
    throw err;
  }

  const model = OPENAI_IMAGE_MODEL();
  const finalPrompt = buildFinalPrompt(prompt, style);
  const size = OPENAI_SIZE_MAP[aspect] || '1024x1024';
  const useSeed = seed !== undefined && seed !== null && seed !== '' ? Number(seed) : randomSeed();

  const body = { model, prompt: finalPrompt.slice(0, MAX_PROMPT_LEN), size, n: 1 };
  if (model.startsWith('gpt-image')) {
    body.quality = 'low';
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  let res;
  try {
    res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      const err = new Error('OpenAI request timed out. Try again.');
      err.status = 504;
      err.provider = 'openai';
      throw err;
    }
    const err = new Error('Could not reach the OpenAI service. Check your network.');
    err.status = 502;
    err.provider = 'openai';
    throw err;
  }
  clearTimeout(timer);

  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = null; }

  if (!res.ok) {
    const err = new Error(mapOpenAIError(res.status, parsed));
    err.status = res.status >= 400 && res.status < 500 && res.status !== 404 ? res.status : 502;
    err.provider = 'openai';
    throw err;
  }

  const item = parsed?.data?.[0];
  if (!item) {
    const err = new Error('OpenAI returned no image data.');
    err.status = 502;
    err.provider = 'openai';
    throw err;
  }

  let url;
  if (item.url) {
    url = item.url;
  } else if (item.b64_json) {
    url = `data:image/png;base64,${item.b64_json}`;
  } else {
    const err = new Error('OpenAI response had no image URL or data.');
    err.status = 502;
    err.provider = 'openai';
    throw err;
  }

  const dim = ASPECTS[aspect] || ASPECTS.square;
  return {
    url,
    seed: useSeed,
    provider: 'openai',
    model,
    demo: false,
    style,
    aspect,
    width: dim.width,
    height: dim.height,
    finalPrompt: finalPrompt.slice(0, MAX_PROMPT_LEN),
    seedSupported: false,
    downloadable: true,
  };
}

// Select + run the provider. explicitProvider overrides env default.
export async function generateImage({ prompt, style, aspect, seed, provider }) {
  const requested = provider || process.env.IMAGE_PROVIDER || 'pollinations';
  const params = { prompt, style, aspect, seed };

  if (requested === 'openai') {
    if (!OPENAI_KEY()) {
      const err = new Error('OpenAI key not configured');
      err.status = 400;
      err.details = { provider: 'OpenAI key not configured' };
      throw err;
    }
    return openaiGenerate(params);
  }
  if (requested === 'demo') return demoGenerate(params);
  return pollinationsGenerate(params);
}

export function defaultProvider() {
  const p = process.env.IMAGE_PROVIDER || 'pollinations';
  return PROVIDERS_LIST.includes(p) ? p : 'pollinations';
}

export const PROVIDERS_LIST = ['pollinations', 'openai', 'demo'];

export function availableProviders() {
  return PROVIDERS_LIST.map((id) => ({
    id,
    label: id === 'pollinations' ? 'Pollinations' : id === 'openai' ? 'OpenAI' : 'Demo',
    available: id === 'openai' ? Boolean(OPENAI_KEY()) : true,
  }));
}

// --- OpenAI text enhance (used as a fallback when Gemini is absent) ---
const OPENAI_TEXT_MODEL = () => process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';

export async function enhanceTextOpenAI(prompt) {
  const key = OPENAI_KEY();
  if (!key) {
    const err = new Error('OpenAI API key not configured.');
    err.status = 503;
    throw err;
  }
  const instruction =
    'Rewrite the user\'s image prompt into ONE descriptive paragraph covering subject, setting, lighting, lens, and mood. ' +
    'No preamble, no quotes, no markdown, under 120 words.';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  let res;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: OPENAI_TEXT_MODEL(),
        messages: [
          { role: 'system', content: instruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      const err = new Error('OpenAI enhance request timed out.');
      err.status = 504;
      throw err;
    }
    const err = new Error('Could not reach the OpenAI service.');
    err.status = 502;
    throw err;
  }
  clearTimeout(timer);

  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = null; }
  if (!res.ok) {
    const err = new Error(mapOpenAIError(res.status, parsed));
    err.status = res.status;
    throw err;
  }
  const out = parsed?.choices?.[0]?.message?.content?.trim();
  if (!out) {
    const err = new Error('OpenAI returned an empty enhancement.');
    err.status = 502;
    throw err;
  }
  return out;
}

export function openaiEnhanceModel() {
  return OPENAI_TEXT_MODEL();
}
