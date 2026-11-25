# AI Text Studio

A full-stack AI text generation studio. Rewrite, summarize, brainstorm, and explain text with OpenAI or Gemini — or use it instantly with no API key thanks to a built-in deterministic demo mode.

## 1. Overview

AI Text Studio is a web app where you type (or paste) a prompt, pick a mode, and get AI-generated text back.

**Five modes:**

| Mode | What it does |
|---|---|
| Freeform | Concise, friendly assistant answers |
| Summarize | 3–6 tight bullets keeping every key fact |
| Rewrite | Clearer, more polished text at a similar length |
| Brainstorm | 6–8 distinct ideas, each with a one-line rationale |
| Explain | Beginner-friendly explanation with exactly one analogy, under 150 words |

**Three providers:**

- **OpenAI** — chat completions API (no SDK)
- **Gemini** — Google Generative Language API (no SDK)
- **Demo** — deterministic local generator, zero network calls, zero cost. Same prompt + mode always produces the same output.

**Provider selection order:** an explicit provider in the request wins; otherwise the `AI_PROVIDER` env var; otherwise whichever API key exists (OpenAI checked first); otherwise demo. If the chosen provider has no key, the app falls back to demo and returns a notice such as `No gemini key configured, using demo mode`.

## 2. Tech stack

- **Backend:** Node.js + Express, native `fetch`, no AI SDKs, ES modules
- **Frontend:** React (Vite), plain CSS, no UI library
- **Dev tooling:** `concurrently` runs server and client together; Vite proxies `/api` to the Express server
- **No native binaries, no databases** — runs anywhere Node runs, including bolt.new (WebContainers)

## 3. Running in bolt.new

1. Open the project. Bolt installs dependencies and runs `npm run dev` automatically. If it does not, run these in the Bolt terminal:
   ```
   npm install
   npm run dev
   ```
2. The app works immediately in demo mode with no keys — the badge shows **Demo**.
3. To use real AI: copy `.env.example` to `.env`, add `GEMINI_API_KEY` and/or `OPENAI_API_KEY`, then restart the dev server.
4. **Warning:** do not share or publish a Bolt project that contains real keys in `.env`.

## 4. Running locally

Requirements: Node 18+.

```
npm install
cp .env.example .env
# optional: add keys to .env
npm run dev
```

Then open the Vite URL (usually http://localhost:5173). The Express API runs on port 5000 and Vite proxies `/api` requests to it.

## 5. Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Port the Express server listens on | `5000` |
| `AI_PROVIDER` | Force a provider: `openai`, `gemini`, or `demo` | unset (auto-detect: first key found, OpenAI first, else demo) |
| `OPENAI_API_KEY` | OpenAI API key (https://platform.openai.com/api-keys) | empty (OpenAI disabled) |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o-mini` |
| `GEMINI_API_KEY` | Google Gemini API key (https://aistudio.google.com/app/apikey) | empty (Gemini disabled) |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` |

## 6. API reference

### `POST /api/generate`

Request body:

```json
{ "prompt": "your text", "mode": "summarize", "provider": "demo", "maxTokens": 300 }
```

- `mode`: one of `freeform | summarize | rewrite | brainstorm | explain` (default `freeform`)
- `provider`: optional, one of `openai | gemini | demo`
- `maxTokens`: integer 50–1000 (default 300)

Success (200):

```json
{ "text": "...", "provider": "demo", "model": "demo-v1", "demo": true, "mode": "summarize" }
```

Validation failure (400):

```json
{ "error": "Validation failed", "details": { "prompt": "Prompt must be at least 4 characters." } }
```

Provider/upstream failure (502):

```json
{ "error": "The openai API key was rejected (invalid or unauthorized).", "provider": "openai" }
```

### `GET /api/generate/config`

Returns the active provider setup:

```json
{ "provider": "demo", "model": "demo-v1", "demo": true, "availableProviders": ["demo"] }
```

## 7. How to test

1. **Demo mode with no keys:** with no keys in `.env`, open the app — the badge shows **Demo**. Generate in each of the five modes; all return useful text.
   One-liner check:
   ```
   node -e "fetch('http://localhost:5000/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Explain how bicycles work',mode:'explain'})}).then(r=>r.json()).then(d=>console.log(d))"
   ```
2. **Gemini with a real key:** set `GEMINI_API_KEY` in `.env`, restart, reload the app — the badge shows **Gemini**. Generate; output comes from the API.
   ```
   node -e "fetch('http://localhost:5000/api/generate/config').then(r=>r.json()).then(d=>console.log(d))"
   ```
3. **Short prompt rejected:** submit a 2-character prompt. The UI disables the button and shows a hint; bypassing it returns HTTP 400 with `details.prompt`.
   ```
   node -e "fetch('http://localhost:5000/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'ab'})}).then(r=>r.json()).then(d=>console.log(d))"
   ```
4. **Bad mode rejected:**
   ```
   node -e "fetch('http://localhost:5000/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'valid prompt here',mode:'hack'})}).then(r=>r.json()).then(d=>console.log(d))"
   ```
   Returns HTTP 400 with `details.mode`.
5. **Invalid key returns readable 502:** set `OPENAI_API_KEY=sk-invalid` in `.env`, restart, and generate with provider `openai`. The server returns HTTP 502 with a plain-English message and the UI shows it in the error banner.
   ```
   node -e "fetch('http://localhost:5000/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'valid prompt here',provider:'openai'})}).then(r=>r.json()).then(d=>console.log(d))"
   ```

## 8. Troubleshooting

- **Blank page or API errors:** confirm both server and client are running (`npm run dev` starts both). The server logs its port; the client prints the Vite URL.
- **"Using demo mode" notice:** no key was detected. Check `.env`, make sure the variable name matches exactly, and restart the dev server.
- **Invalid key error:** check the key value and that billing/quota is active on the provider account.
- **Real calls fail in bolt.new but demo works:** the browser-based runtime may block outbound requests. Run the project locally instead.
- **Port in use:** change `PORT` in `.env` and update the proxy target in `vite.config.js`.

## 9. Project structure

```
├── index.html              # Vite entry page
├── package.json            # Single root package (client + server)
├── vite.config.js          # Vite config, proxies /api to port 5000
├── .env.example            # Template for environment variables
├── server/
│   ├── index.js            # Express setup, JSON body parser, route mounting
│   ├── routes/
│   │   └── generate.js     # POST /api/generate, GET /api/generate/config
│   └── lib/
│       ├── ai.js           # Provider module (OpenAI, Gemini, demo), selection + timeout
│       ├── constants.js    # Default models, limits, modes, providers
│       ├── demo.js         # Deterministic demo generator
│       ├── prompts.js      # Mode -> system prompt map
│       └── validate.js     # Request validation
└── src/
    ├── main.jsx            # React entry
    ├── App.jsx             # App shell, state, API calls
    ├── constants.js        # Shared client-side constants
    ├── styles.css          # Plain CSS styles
    └── components/
        ├── ModeTabs.jsx    # Five mode tabs
        ├── PromptBox.jsx   # Textarea, character counter, token slider, Generate button
        ├── ResultPanel.jsx # Result text, metadata, copy button, notices
        └── HistoryList.jsx # In-session history (React state only)
```
