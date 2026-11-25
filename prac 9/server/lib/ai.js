import { DEFAULT_MODELS, TIMEOUT_MS } from './constants.js';
import { SYSTEM_PROMPTS } from './prompts.js';
import { generateDemoText } from './demo.js';

function openaiKey() {
  return process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim();
}

function geminiKey() {
  return process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim();
}

export function getProviderConfig() {
  const openai = Boolean(openaiKey());
  const gemini = Boolean(geminiKey());
  let provider;
  let notice;

  const envProvider = process.env.AI_PROVIDER && process.env.AI_PROVIDER.trim();
  if (envProvider) {
    provider = envProvider;
  } else if (openai) {
    provider = 'openai';
  } else if (gemini) {
    provider = 'gemini';
  } else {
    provider = 'demo';
  }

  if (provider !== 'demo' && provider !== 'openai' && provider !== 'gemini') {
    notice = `Unknown AI_PROVIDER "${provider}", using demo mode`;
    provider = 'demo';
  }
  if (provider === 'openai' && !openai) {
    notice = 'No openai key configured, using demo mode';
    provider = 'demo';
  }
  if (provider === 'gemini' && !gemini) {
    notice = 'No gemini key configured, using demo mode';
    provider = 'demo';
  }

  const model =
    provider === 'openai'
      ? process.env.OPENAI_MODEL || DEFAULT_MODELS.openai
      : provider === 'gemini'
        ? process.env.GEMINI_MODEL || DEFAULT_MODELS.gemini
        : 'demo-v1';

  return {
    provider,
    model,
    demo: provider === 'demo',
    notice,
    availableProviders: ['demo', ...(openai ? ['openai'] : []), ...(gemini ? ['gemini'] : [])],
  };
}

export async function generateText({ prompt, mode, provider, maxTokens }) {
  let requested = provider;
  if (!requested) {
    const cfg = getProviderConfig();
    requested = cfg.provider;
  }

  let chosen = requested;
  let notice;
  const hasOpenai = Boolean(openaiKey());
  const hasGemini = Boolean(geminiKey());

  if (chosen === 'openai' && !hasOpenai) {
    notice = 'No openai key configured, using demo mode';
    chosen = 'demo';
  } else if (chosen === 'gemini' && !hasGemini) {
    notice = 'No gemini key configured, using demo mode';
    chosen = 'demo';
  }

  const model =
    chosen === 'openai'
      ? process.env.OPENAI_MODEL || DEFAULT_MODELS.openai
      : chosen === 'gemini'
        ? process.env.GEMINI_MODEL || DEFAULT_MODELS.gemini
        : 'demo-v1';

  let text;
  if (chosen === 'openai') {
    text = await callOpenAI({ prompt, mode, maxTokens, model });
  } else if (chosen === 'gemini') {
    text = await callGemini({ prompt, mode, maxTokens, model });
  } else {
    text = generateDemoText({ prompt, mode });
  }
  return { text, provider: chosen, model, demo: chosen === 'demo', mode, ...(notice ? { notice } : {}) };
}

function readableUpstreamError(status, bodyText, providerName) {
  if (status === 401 || status === 403) {
    return `The ${providerName} API key was rejected (invalid or unauthorized).`;
  }
  if (status === 429) {
    return `The ${providerName} rate limit or quota was hit. Try again shortly or check your billing.`;
  }
  if (status === 404) {
    return `The configured ${providerName} model was not found. Check the model name in .env.`;
  }
  if (status >= 500) {
    return `${providerName} had a temporary server problem (${status}). Try again shortly.`;
  }
  return `The ${providerName} request failed with status ${status}.`;
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI({ prompt, mode, maxTokens, model }) {
  const key = openaiKey();
  if (!key) throw Object.assign(new Error('No openai key configured'), { provider: 'openai' });

  let res;
  try {
    res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: maxTokens,
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[mode] },
          { role: 'user', content: prompt },
        ],
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw Object.assign(new Error('The openai request timed out after 30 seconds.'), { provider: 'openai', kind: 'timeout' });
    }
    throw Object.assign(new Error('Could not reach openai (network error).'), { provider: 'openai', kind: 'network' });
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw Object.assign(new Error(readableUpstreamError(res.status, bodyText, 'openai')), {
      provider: 'openai',
      status: res.status,
    });
  }

  const data = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string') {
    throw Object.assign(new Error('openai returned an unexpected response shape.'), { provider: 'openai' });
  }
  return text;
}

async function callGemini({ prompt, mode, maxTokens, model }) {
  const key = geminiKey();
  if (!key) throw Object.assign(new Error('No gemini key configured'), { provider: 'gemini' });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let res;
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[mode] }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw Object.assign(new Error('The gemini request timed out after 30 seconds.'), { provider: 'gemini', kind: 'timeout' });
    }
    throw Object.assign(new Error('Could not reach gemini (network error).'), { provider: 'gemini', kind: 'network' });
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw Object.assign(new Error(readableUpstreamError(res.status, bodyText, 'gemini')), {
      provider: 'gemini',
      status: res.status,
    });
  }

  const data = await res.json().catch(() => null);
  const cand = data?.candidates?.[0];
  const text = cand?.content?.parts?.map((p) => p?.text).filter((t) => typeof t === 'string').join('');
  if (typeof text !== 'string' || text.length === 0) {
    const reason = cand?.finishReason ? ` (finish reason: ${cand.finishReason})` : '';
    throw Object.assign(new Error(`gemini returned no text${reason}.`), { provider: 'gemini' });
  }
  return text;
}
