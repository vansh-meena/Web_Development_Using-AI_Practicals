const express = require('express');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 4012;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const SUMMARY_STYLES = ['bullets', 'paragraph', 'keyterms', 'exam'];
const SUMMARY_LENGTHS = ['short', 'medium'];

const app = express();
app.use(express.json({ limit: '20kb' }));

// service-free admin client for server-side queries when needed (no service role here)
const sbServer = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ---- error helpers ----
function apiError(res, status, message, details) {
  return res.status(status).json({ error: { message, details } });
}

// wrap async handlers so rejections never crash the process
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---- routes ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    demo: !GEMINI_API_KEY,
  });
});

// auth middleware
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return apiError(res, 401, 'Authentication required.');
    const token = match[1];

    if (!sbServer) return apiError(res, 500, 'Server is not configured.');

    const { data, error } = await sbServer.auth.getUser(token);
    if (error || !data || !data.user) {
      return apiError(res, 401, 'Invalid or expired session.');
    }
    req.user = data.user;
    req.token = token;
    req.sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    next();
  } catch (err) {
    next(err);
  }
}

// ---- Gemini / demo summarizers ----
function buildSystemPrompt(style, length) {
  const lengthHint = length === 'short'
    ? 'Keep the output to about 80 words or fewer.'
    : 'Keep the output to about 200 words.';

  const baseRules =
    'Use plain text only. Do not use markdown symbols except a single "-" at the start of a bullet line. ' +
    'Never invent facts that are not stated in the notes. ' + lengthHint;

  switch (style) {
    case 'bullets':
      return 'Summarize the study notes into 5 to 8 tight bullet points covering every key fact. ' + baseRules;
    case 'paragraph':
      return 'Summarize the study notes into one short, clear paragraph. ' + baseRules;
    case 'keyterms':
      return 'Extract 6 to 10 key terms from the notes. For each, give a one-line definition. ' + baseRules;
    case 'exam':
      return 'Write 5 likely exam questions based on the notes. For each, give a one-line answer. ' + baseRules;
    default:
      return baseRules;
  }
}

function extractiveSummary(text, style, length) {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const target = length === 'short' ? 2 : 5;
  const chosen = sentences.slice(0, target);

  if (style === 'bullets') {
    return chosen.map((s) => '- ' + s).join('\n');
  }
  if (style === 'paragraph') {
    return chosen.join(' ');
  }
  if (style === 'keyterms') {
    return chosen
      .map((s) => {
        const key = s.split(' ').slice(0, 4).join(' ').replace(/[.,;:]+$/, '');
        return '- ' + key + ': ' + s;
      })
      .join('\n');
  }
  if (style === 'exam') {
    return chosen
      .map((s, i) => 'Q' + (i + 1) + ': ' + s + '\nA: ' + s)
      .join('\n');
  }
  return chosen.join(' ');
}

async function generateSummary(text, style, length) {
  if (!GEMINI_API_KEY) {
    return { summary: extractiveSummary(text, style, length), isDemo: true, model: 'demo' };
  }

  const maxTokens = length === 'short' ? 600 : 1000;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(style, length) }] },
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = new Error('Gemini request failed: ' + resp.status);
    err.status = resp.status;
    throw err;
  }
  const data = await resp.json();
  const out =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;
  if (!out) {
    const err = new Error('Gemini returned no usable content.');
    err.status = 502;
    throw err;
  }
  return { summary: out.trim(), isDemo: false, model: GEMINI_MODEL };
}

app.post('/api/summarize', authMiddleware, wrap(async (req, res) => {
  const { text, style, length } = req.body || {};

  const errors = {};
  if (typeof text !== 'string') {
    errors.text = 'Notes text is required.';
  } else {
    const trimmed = text.trim();
    if (trimmed.length < 50) errors.text = 'Notes must be at least 50 characters.';
    else if (trimmed.length > 6000) errors.text = 'Notes must be at most 6000 characters.';
  }
  if (!SUMMARY_STYLES.includes(style)) errors.style = 'Invalid style.';
  if (!SUMMARY_LENGTHS.includes(length)) errors.length = 'Invalid length.';
  if (Object.keys(errors).length) return apiError(res, 400, 'Please fix the highlighted fields.', errors);

  // rate limit: 10 notes in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await req.sb
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo);
  if (countErr) throw countErr;
  if (count >= 10) {
    return apiError(res, 429, 'You have created 10 notes in the last hour. Please try again later.');
  }

  let generated;
  try {
    generated = await generateSummary(text.trim(), style, length);
  } catch (err) {
    if (err.status === 502) {
      return apiError(res, 502, 'The AI service is busy or its quota is used up. Please try again in a minute.');
    }
    return apiError(res, 502, 'The AI service is busy or its quota is used up. Please try again in a minute.');
  }

  const trimmedText = text.trim().replace(/\s+/g, ' ');
  const title = trimmedText.slice(0, 60);

  const { data: row, error: insertErr } = await req.sb
    .from('notes')
    .insert({
      title,
      source_text: trimmedText,
      summary: generated.summary,
      style,
      length,
      model: generated.model,
      is_demo: generated.isDemo,
    })
    .select()
    .single();
  if (insertErr) throw insertErr;

  res.status(201).json({ note: row });
}));

app.get('/api/notes', authMiddleware, wrap(async (req, res) => {
  const { data, error } = await req.sb
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  res.json({ notes: data });
}));

app.delete('/api/notes/:id', authMiddleware, wrap(async (req, res) => {
  const id = req.params.id;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return apiError(res, 400, 'Invalid note id.');

  const { count, error: findErr } = await req.sb
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('id', id);
  if (findErr) throw findErr;
  if (count === 0) return apiError(res, 404, 'Note not found.');

  const { error: delErr } = await req.sb.from('notes').delete().eq('id', id);
  if (delErr) throw delErr;
  res.status(204).end();
}));

// unknown /api routes
app.use('/api', (req, res) => {
  apiError(res, 404, 'API route not found.');
});

// central error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  apiError(res, 500, 'Something went wrong on the server.');
});

// serve static files only when run directly (local dev)
if (require.main === module) {
  app.use(express.static('public'));
  app.listen(PORT, () => {
    console.log('NoteLens listening on port ' + PORT);
  });
}

module.exports = app;
