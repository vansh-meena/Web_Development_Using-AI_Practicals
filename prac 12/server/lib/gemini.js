// Google Gemini calls for captioning and text enhancement.
// Uses native fetch only - no SDK. Keys come from env and never leave the server.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function envConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite',
  };
}

export function captionAvailable() {
  return Boolean(envConfig().apiKey);
}

function mapGeminiError(status, body) {
  if (status === 401 || status === 403) return 'Gemini API key is invalid or not authorized.';
  if (status === 429) return 'Gemini rate limit or quota reached. Try again later.';
  if (status >= 500) return 'Gemini service is temporarily unavailable.';
  const msg = body?.error?.message;
  if (msg) return `Gemini request failed: ${msg}`;
  return 'Gemini request failed.';
}

async function postGenerateContent(model, apiKey, payload, timeoutMs = 30_000) {
  const url = `${GEMINI_BASE}/${model}:generateContent`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = null; }
    if (!res.ok) {
      const err = new Error(mapGeminiError(res.status, body));
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  } catch (e) {
    if (e.name === 'AbortError') {
      const err = new Error('Gemini request timed out. Try again.');
      err.status = 504;
      throw err;
    }
    if (e.status) throw e;
    const err = new Error('Could not reach the Gemini service. Check your network.');
    err.status = 502;
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Caption an uploaded image. image is a data URL; mimeType is one of the
// allowed image types. Returns { caption, model }.
export async function captionImage(image, mimeType) {
  const { apiKey, model } = envConfig();
  if (!apiKey) {
    const err = new Error('Captioning needs GEMINI_API_KEY on the server.');
    err.status = 503;
    throw err;
  }

  const match = image.match(/^data:image\/[a-z]+;base64,(.+)$/i);
  if (!match) {
    const err = new Error('Image data URL is malformed.');
    err.status = 400;
    throw err;
  }
  const data = match[1];

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'Describe this image in one or two sentences as a clear caption.' },
          { inlineData: { mimeType, data } },
        ],
      },
    ],
  };

  const body = await postGenerateContent(model, apiKey, payload);

  const parts = body?.candidates?.[0]?.content?.parts;
  if (!parts) {
    const blocked = body?.promptFeedback?.blockReason;
    if (blocked) {
      const err = new Error('Gemini blocked this request. Try a different image.');
      err.status = 502;
      throw err;
    }
    const err = new Error('Gemini returned no caption candidates.');
    err.status = 502;
    throw err;
  }
  const text = parts.map((p) => p.text || '').join('').trim();
  if (!text) {
    const err = new Error('Gemini returned an empty caption.');
    err.status = 502;
    throw err;
  }
  return { caption: text, model };
}

// Enhance a text prompt via Gemini. Returns a single paragraph.
export async function enhanceTextGemini(prompt) {
  const { apiKey, model } = envConfig();
  if (!apiKey) {
    const err = new Error('Gemini API key not configured.');
    err.status = 503;
    throw err;
  }
  const instruction =
    'Rewrite the user\'s image prompt into ONE descriptive paragraph covering subject, setting, lighting, lens, and mood. ' +
    'No preamble, no quotes, no markdown, under 120 words.';
  const payload = {
    contents: [
      { role: 'user', parts: [{ text: `${instruction}\n\nPrompt: ${prompt}` }] },
    ],
  };
  const body = await postGenerateContent(model, apiKey, payload, 20_000);
  const parts = body?.candidates?.[0]?.content?.parts;
  const text = parts ? parts.map((p) => p.text || '').join('').trim() : '';
  if (!text) {
    const err = new Error('Gemini returned an empty enhancement.');
    err.status = 502;
    throw err;
  }
  return text;
}

export function geminiModel() {
  return envConfig().model;
}
