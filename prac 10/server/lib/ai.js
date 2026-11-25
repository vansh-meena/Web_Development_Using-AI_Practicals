import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENAI_MODEL,
  MAX_OUTPUT_TOKENS,
  REQUEST_TIMEOUT_MS,
} from './constants.js';
import { demoReply } from './demoFaq.js';
import { SYSTEM_PROMPT } from './systemPrompt.js';

export class ProviderError extends Error {
  constructor(message, provider) {
    super(message);
    this.provider = provider;
  }
}

function resolveProvider(requested) {
  const aiProvider = process.env.AI_PROVIDER;
  if (requested) return requested;
  if (aiProvider && ['openai', 'gemini', 'demo'].includes(aiProvider)) return aiProvider;
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return 'demo';
}

function hasKey(provider) {
  if (provider === 'openai') return Boolean(process.env.OPENAI_API_KEY);
  if (provider === 'gemini') return Boolean(process.env.GEMINI_API_KEY);
  return true; // demo needs no key
}

export function getConfig() {
  const provider = resolveProvider();
  const effective = hasKey(provider) ? provider : 'demo';
  const model =
    effective === 'openai'
      ? process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
      : effective === 'gemini'
        ? process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
        : 'builtin-faq';
  return { provider: effective, model, demo: effective === 'demo' };
}

function contextFrom(error) {
  return {
    status: error?.status ?? null,
    timedOut: error?.name === 'AbortError',
    network: error?.name === 'TypeError' || error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED',
  };
}

function friendlyError(provider, { status, timedOut, network }) {
  if (timedOut) {
    return 'The AI assistant took too long to respond. Please try again in a moment.';
  }
  if (network) {
    return 'We could not reach the AI service. Please check your internet connection and try again.';
  }
  if (status === 401 || status === 403) {
    return 'The AI service rejected the configured API key. Please check the key on the server and try again.';
  }
  if (status === 429) {
    return 'The AI service is rate limited or out of quota. Please try again later, or ask the administrator to use a lighter model (a Gemini flash-lite model has generous free-tier limits).';
  }
  if (status >= 400) {
    return 'The AI service returned an unexpected error. Please try again in a moment.';
  }
  return 'We could not get an answer from the AI assistant. Please try again.';
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAI({ history, message }) {
  const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message },
      ],
    }),
  });
  if (!response.ok) {
    throw Object.assign(new Error('OpenAI request failed'), { status: response.status });
  }
  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== 'string' || reply.trim().length === 0) {
    throw Object.assign(new Error('OpenAI returned no content'), { status: 502 });
  }
  return reply.trim();
}

async function callGemini({ history, message }) {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  // Gemini only accepts "user" and "model" roles, and contents must start
  // with a user turn.
  const contents = [];
  for (const entry of history) {
    const role = entry.role === 'assistant' ? 'model' : 'user';
    if (contents.length === 0 && role !== 'user') continue;
    if (contents.length > 0 && contents[contents.length - 1].role === role) continue;
    contents.push({ role, parts: [{ text: entry.content }] });
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
    }),
  });
  if (!response.ok) {
    throw Object.assign(new Error('Gemini request failed'), { status: response.status });
  }
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const reply = Array.isArray(parts)
    ? parts.map((p) => p?.text).filter((t) => typeof t === 'string').join('')
    : '';
  if (reply.trim().length === 0) {
    throw Object.assign(new Error('Gemini returned no content'), { status: 502 });
  }
  return reply.trim();
}

export async function generateReply({ history, message, provider }) {
  const chosen = resolveProvider(provider);
  const effective = hasKey(chosen) ? chosen : 'demo';

  if (effective === 'demo') {
    return { reply: demoReply(message, history), provider: 'demo' };
  }

  let reply;
  try {
    reply = effective === 'openai'
      ? await callOpenAI({ history, message })
      : await callGemini({ history, message });
  } catch (err) {
    throw new ProviderError(friendlyError(effective, contextFrom(err)), effective);
  }
  return { reply, provider: effective };
}
