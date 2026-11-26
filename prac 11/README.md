# PostForge

PostForge is a full-stack AI content generation web app that creates **blog posts, emails, and social media posts** (Instagram, X threads, LinkedIn). It runs entirely in [bolt.new](https://bolt.new) WebContainers and locally with a single command, and works immediately in **demo mode** with no API key.

## Overview

- **Five content types**: blog, email, instagram, x (thread), linkedin — each with its own format guide.
- **Five tones**: professional, casual, friendly, witty, persuasive — each with distinct style instructions.
- **Three lengths**: short, medium, long — each sets a word target and a max-tokens budget.
- **Providers**: OpenAI, Gemini, and a built-in demo mode.
- **Provider order**: explicit request provider → `AI_PROVIDER` env → whichever key exists (OpenAI first) → demo. If a chosen provider has no key, it falls back to demo with a notice.
- **Demo behaviour**: deterministic templates build content from your topic and key points, following each format guide exactly. Tone visibly changes openings, sentence style, and closings; length changes structure (more sections, paragraphs, bullets, or tweets). No network call is made.

## Running in bolt.new

1. Open the project in bolt.new.
2. If it does not start by itself, run:
   ```
   npm install
   npm run dev
   ```
3. It works immediately in demo mode (no API key needed).
4. For real AI output, copy `.env.example` to `.env`, add an API key, and restart the dev server.

> Do not share or publish a bolt project containing real API keys.

## Running locally

Requires **Node 18+** (LTS recommended).

```
npm install
cp .env.example .env     # add keys (optional)
npm run dev
```

Then open the Vite URL (usually http://localhost:5173). The Vite dev server proxies `/api` requests to the Express server on port 5004.

## Environment variables

| Variable         | Purpose                                              | Default                  |
| ---------------- | --------------------------------------------------- | ------------------------ |
| `PORT`           | Port the Express server listens on                  | `5004`                   |
| `AI_PROVIDER`    | Force a provider: `openai`, `gemini`, or `demo`      | (auto-detect keys)       |
| `OPENAI_API_KEY` | OpenAI API key                                       | (empty)                  |
| `OPENAI_MODEL`   | OpenAI model                                         | `gpt-4o-mini`            |
| `GEMINI_API_KEY` | Google Gemini API key                                | (empty)                  |
| `GEMINI_MODEL`   | Gemini model                                         | `gemini-2.0-flash-lite`  |

Keys stay on the server and are never sent to the browser.

## API reference

### `POST /api/content/generate`

Request body:

```json
{
  "type": "blog",
  "topic": "How remote teams stay productive",
  "tone": "professional",
  "length": "medium",
  "keyPoints": "Async-first communication\nClear documentation",
  "provider": "demo",
  "refresh": false
}
```

- `type`: `blog | email | instagram | x | linkedin`
- `topic`: 3–1000 characters after trim
- `tone`: `professional | casual | friendly | witty | persuasive`
- `length`: `short | medium | long`
- `keyPoints` (optional): up to 1500 characters
- `provider` (optional): `openai | gemini | demo`
- `refresh` (optional): `true` skips the cache

Successful response (200):

```json
{
  "text": "# ...",
  "type": "blog",
  "tone": "professional",
  "length": "medium",
  "provider": "demo",
  "model": "demo",
  "demo": true,
  "wordCount": 412,
  "charCount": 2841,
  "warnings": [],
  "cached": false
}
```

Validation failure (400):

```json
{
  "error": "Validation failed",
  "details": {
    "topic": "topic is required and must be 3 to 1000 characters after trim.",
    "tone": "tone is required and must be one of professional, casual, friendly, witty, persuasive."
  }
}
```

Provider failure (502):

```json
{
  "error": "Your OpenAI API key appears to be invalid. Check OPENAI_API_KEY in .env.",
  "provider": "openai"
}
```

Rate limit (429):

```json
{ "error": "Too many requests. Wait a few seconds and try again." }
```

### `GET /api/content/config`

Returns the current provider, model, available providers, and option lists the UI builds from:

```json
{
  "provider": "demo",
  "model": "demo",
  "demo": true,
  "notice": null,
  "availableProviders": ["demo"],
  "types": ["blog", "email", "instagram", "x", "linkedin"],
  "tones": ["professional", "casual", "friendly", "witty", "persuasive"],
  "lengths": ["short", "medium", "long"]
}
```

### `GET /api/health`

```json
{ "status": "ok" }
```

## How to test

### UI tests

1. Pick each of the five types, enter a topic, and Generate in demo mode. Confirm each follows its format guide:
   - **blog** has `#` and `##` headings
   - **email** starts with `Subject:`
   - **instagram** ends with 8–12 hashtags, one per line
   - **x** is a numbered thread (`1/`, `2/`, …) with every tweet ≤ 280 characters
   - **linkedin** has a hook, 3–5 bullets, a takeaway, and 3–5 hashtags
2. Same type and length, all five tones — the text should be clearly different.
3. Same type and tone, short vs long — the output should be clearly different sizes.
4. Enter a 2-character topic and pick tone "angry" (or type "tiktok") — you should get a 400 error with per-field details.
5. Generate, then use Copy, Download .md, and Download .txt. Generate again, then click a history item to restore it.
6. Generate the same input twice — the second result should show a "Cached result" notice with a Regenerate button.

### One-liner fetch test

```
node -e "fetch('http://localhost:5004/api/content/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'blog',topic:'Healthy morning routines',tone:'casual',length:'short',provider:'demo'})}).then(r=>r.json()).then(j=>console.log(j.text.slice(0,200)))"
```

Validation failure test:

```
node -e "fetch('http://localhost:5004/api/content/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'tiktok',topic:'hi',tone:'angry',length:'short'})}).then(r=>{console.log(r.status);return r.json()}).then(j=>console.log(j))"
```

## Troubleshooting

- **Port in use**: change `PORT` in `.env` and the proxy target in `vite.config.js` to the same port.
- **429 quota errors**: wait a few minutes, or switch to a flash-lite Gemini model (`GEMINI_MODEL=gemini-2.0-flash-lite`) for better free-tier limits.
- **"Demo mode" banner showing**: no API key was detected. Copy `.env.example` to `.env`, add a key, and restart the dev server.
- **Blank page**: open the browser console for errors. The app wraps everything in an ErrorBoundary that shows a reload button instead of a blank screen.
- **Real calls failing only in bolt.new**: WebContainer networking can be limited. Run the project locally for reliable provider calls.

## Project structure

```
server/
  index.js              Express setup, JSON parser, mounts routes
  routes/content.js     content endpoints (generate, config)
  lib/ai.js             provider layer: openai, gemini, demo + cache
  lib/cache.js          in-memory cache (50 entries, 30 min TTL)
  lib/rateLimiter.js    8 real calls/minute limiter
  lib/formatGuides.js   per-type format guides + length map
  lib/tones.js          tone -> style instructions
  lib/validate.js       request validation
  lib/demo.js           deterministic demo templates
  lib/constants.js      default models + port
src/
  main.jsx              React entry
  App.jsx               app state and layout
  styles.css            plain CSS theme
  components/
    ErrorBoundary.jsx   crash-safe boundary with reload
    Header.jsx          brand + provider badge + demo banner
    TypeCards.jsx       five content type cards
    GeneratorForm.jsx   topic, tone, length, key points, provider
    ResultPanel.jsx     preview/edit tabs, copy, download, notices
    MarkdownView.jsx    safe markdown -> React renderer
    HistoryList.jsx     last 20 generations
index.html              HTML entry
vite.config.js          Vite config + /api proxy to port 5004
package.json            single root manifest (server + client)
.env.example            environment variable template
```
