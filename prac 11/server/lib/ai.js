import { getOpenAIModel, getGeminiModel } from './constants.js';
import { FORMAT_GUIDES, lengthInstruction, maxTokens, LENGTH_MAP } from './formatGuides.js';
import { TONE_INSTRUCTIONS } from './tones.js';
import { generateDemo } from './demo.js';
import { getCache, setCache, cacheKey } from './cache.js';

const TIMEOUT_MS = 30000;

function buildSystemMessage(type, tone, length) {
  return [
    'You are a professional content writer.',
    FORMAT_GUIDES[type],
    `Tone: ${TONE_INSTRUCTIONS[tone]}`,
    lengthInstruction(type, length),
    'Output only the finished content, with no preamble such as "Here is your post".',
  ].join('\n');
}

function buildUserMessage(topic, keyPoints) {
  let msg = `Topic: ${topic}`;
  if (keyPoints && keyPoints.trim()) {
    const points = keyPoints.split(/\n/).map((s) => s.trim()).filter(Boolean);
    msg += `\n\nInclude every one of these key points:\n${points.map((p) => `- ${p}`).join('\n')}`;
  }
  return msg;
}

function countWords(text) {
  return (text.trim().match(/\S+/g) || []).length;
}

function detectXWarnings(text) {
  const warnings = [];
  const lines = text.split(/\n/).filter((l) => /^\d+\//.test(l.trim()));
  lines.forEach((line) => {
    const m = line.trim().match(/^(\d+)\//);
    if (m && line.length > 280) {
      warnings.push(`Tweet ${m[1]} is over 280 characters`);
    }
  });
  return warnings;
}

export function resolveProvider(requestedProvider) {
  const envProvider = process.env.AI_PROVIDER;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  if (requestedProvider && requestedProvider !== 'demo') {
    if (requestedProvider === 'openai' && !hasOpenAI) {
      return { provider: 'demo', notice: 'No openai key configured, using demo mode' };
    }
    if (requestedProvider === 'gemini' && !hasGemini) {
      return { provider: 'demo', notice: 'No gemini key configured, using demo mode' };
    }
    return { provider: requestedProvider, notice: null };
  }
  if (envProvider && envProvider !== 'demo') {
    if (envProvider === 'openai' && !hasOpenAI) {
      return { provider: 'demo', notice: 'No openai key configured, using demo mode' };
    }
    if (envProvider === 'gemini' && !hasGemini) {
      return { provider: 'demo', notice: 'No gemini key configured, using demo mode' };
    }
    return { provider: envProvider, notice: null };
  }
  if (hasOpenAI) return { provider: 'openai', notice: null };
  if (hasGemini) return { provider: 'gemini', notice: null };
  return { provider: 'demo', notice: null };
}

async function callWithTimeout(fetchPromise, signal) {
  return fetchPromise;
}

async function callOpenAI(systemMessage, userMessage, tokens) {
  const key = process.env.OPENAI_API_KEY;
  const model = getOpenAIModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage },
        ],
        max_tokens: tokens,
      }),
      signal: controller.signal,
    });
    if (res.status === 401 || res.status === 403) {
      const err = new Error('Your OpenAI API key appears to be invalid. Check OPENAI_API_KEY in .env.');
      err.code = 'auth';
      throw err;
    }
    if (res.status === 429) {
      const err = new Error('OpenAI rate limit or quota reached. Wait a few minutes or try a flash-lite Gemini model.');
      err.code = 'rate';
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`OpenAI request failed (${res.status}).`);
      err.code = 'upstream';
      throw err;
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const finish = data?.choices?.[0]?.finish_reason;
    if (!content.trim()) {
      const err = new Error('The model returned an empty response. Try again.');
      err.code = 'empty';
      throw err;
    }
    return { text: content, model, truncated: finish === 'length' };
  } catch (e) {
    if (e.name === 'AbortError') {
      const err = new Error('The request to OpenAI timed out. Try a shorter length.');
      err.code = 'timeout';
      throw err;
    }
    if (e.code) throw e;
    const err = new Error('Could not reach OpenAI. Check your network connection.');
    err.code = 'network';
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(systemMessage, userMessage, tokens) {
  const key = process.env.GEMINI_API_KEY;
  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemMessage }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: tokens },
      }),
      signal: controller.signal,
    });
    if (res.status === 401 || res.status === 403) {
      const err = new Error('Your Gemini API key appears to be invalid. Check GEMINI_API_KEY in .env.');
      err.code = 'auth';
      throw err;
    }
    if (res.status === 429) {
      const err = new Error('Gemini rate limit or quota reached. Wait a few minutes or try a flash-lite model.');
      err.code = 'rate';
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`Gemini request failed (${res.status}).`);
      err.code = 'upstream';
      throw err;
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const content = parts.map((p) => p.text || '').join('');
    const finish = data?.candidates?.[0]?.finishReason;
    if (!content.trim()) {
      const err = new Error('The model returned an empty response. Try again.');
      err.code = 'empty';
      throw err;
    }
    return { text: content, model, truncated: finish === 'MAX_TOKENS' };
  } catch (e) {
    if (e.name === 'AbortError') {
      const err = new Error('The request to Gemini timed out. Try a shorter length.');
      err.code = 'timeout';
      throw err;
    }
    if (e.code) throw e;
    const err = new Error('Could not reach Gemini. Check your network connection.');
    err.code = 'network';
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateContent(input) {
  const { type, topic, tone, length, keyPoints, provider: requestedProvider, refresh } = input;
  const { provider, notice } = resolveProvider(requestedProvider);
  const isDemo = provider === 'demo';

  const model = isDemo ? 'demo' : provider === 'openai' ? getOpenAIModel() : getGeminiModel();

  const key = cacheKey({ type, tone, length, topic, keyPoints, provider, model });
  if (!isDemo && !refresh) {
    const cached = getCache(key);
    if (cached) {
      return { ...cached, cached: true };
    }
  }

  const systemMessage = buildSystemMessage(type, tone, length);
  const userMessage = buildUserMessage(topic, keyPoints);
  const tokens = maxTokens(type, length);

  let text;
  let truncated = false;
  let warnings = [];

  if (isDemo) {
    text = generateDemo({ type, topic, tone, length, keyPoints });
  } else if (provider === 'openai') {
    const r = await callOpenAI(systemMessage, userMessage, tokens);
    text = r.text;
    truncated = r.truncated;
  } else if (provider === 'gemini') {
    const r = await callGemini(systemMessage, userMessage, tokens);
    text = r.text;
    truncated = r.truncated;
  }

  if (truncated) warnings.push('Output was cut off. Try a shorter length.');
  if (type === 'x') warnings = warnings.concat(detectXWarnings(text));

  const result = {
    text,
    type,
    tone,
    length,
    provider,
    model,
    demo: isDemo,
    wordCount: countWords(text),
    charCount: text.length,
    warnings,
    cached: false,
  };
  if (notice) result.notice = notice;

  if (!isDemo) {
    setCache(key, result);
  }

  return result;
}

export { LENGTH_MAP };
