# Platypus University Help Center

A full-stack AI chatbot for the (fictional) **Platypus University** website. Visitors can ask about admissions, courses, fees, hostels, facilities, placements and contact details. The assistant keeps its answers short, warm and factual, and it never invents exact dates or fees.

## 1. Overview

- **Frontend:** React (Vite) with plain CSS — chat bubbles, typing indicator, suggestion chips, auto-scroll, provider badge, reset button. No UI library.
- **Backend:** Node.js + Express (ES modules, native `fetch`, no SDKs). It talks to the AI provider server-side so **API keys never reach the browser**.
- **Providers:** `openai` (Chat Completions API), `gemini` (Generative Language API with `systemInstruction`, sent via the `x-goog-api-key` header), and `demo` (a built-in, keyword-based FAQ — no network calls at all).
- **Provider order:** an explicit `provider` in the request wins; otherwise the `AI_PROVIDER` env var; otherwise whichever key exists (OpenAI first); otherwise **demo**. If the chosen provider has no key configured, the server safely falls back to demo mode.
- **Demo mode:** works out of the box with zero configuration. Answers come from a deterministic FAQ that covers admissions, courses, fees, hostels (including food/mess), facilities, placements, contact details, greetings and thanks. Short follow-up questions ("what about the food?") reuse the topic of the previous user message in the session. Anything unmatched gets an honest "I don't know" plus the admissions email.

The UI shows a clear banner whenever it is running in demo mode.

## 2. Running in bolt.new

1. Open the project — it should start by itself. If it does not, run `npm install` then `npm run dev` in the terminal.
2. It works **immediately in demo mode**, no key needed.
3. For real AI: copy `.env.example` to `.env`, add an `OPENAI_API_KEY` (and/or `GEMINI_API_KEY`), then restart the dev server.
4. Never share or publish a bolt project that contains real keys.

## 3. Running locally

Requires **Node 18+** (for native `fetch`).

```bash
npm install
cp .env.example .env    # optional: add keys
npm run dev             # starts Express + Vite together
```

Then open the Vite URL (usually `http://localhost:5173`).

## 4. Environment variables

| Variable         | Purpose                                                | Default                    |
| ---------------- | ------------------------------------------------------ | -------------------------- |
| `PORT`           | Express port. Avoid 5000 (macOS AirPlay).              | `5003`                     |
| `AI_PROVIDER`    | Preferred provider: `openai`, `gemini` or `demo`.      | unset (auto-detect)        |
| `OPENAI_API_KEY` | OpenAI key. Enables the `openai` provider.             | unset (demo fallback)      |
| `OPENAI_MODEL`   | OpenAI model name.                                     | `gpt-4o-mini`              |
| `GEMINI_API_KEY` | Google Gemini key. Enables the `gemini` provider.      | unset (demo fallback)      |
| `GEMINI_MODEL`   | Gemini model name. A flash-lite model is default for the best free-tier limits. | `gemini-2.5-flash-lite` |

## 5. API reference

### `GET /api/health`

```json
{ "status": "ok" }
```

### `GET /api/chat/config`

Returns the active provider and model:

```json
{ "provider": "demo", "model": "builtin-faq", "demo": true }
```

### `POST /api/chat`

Request body:

```json
{ "message": "How do I apply?", "sessionId": "optional", "provider": "optional" }
```

Success (`200`):

```json
{
  "reply": "Applying to Platypus University is simple: ...",
  "sessionId": "7c9e6679-742f-4b9a-a2f3-6d8f0a1b2c3d",
  "provider": "demo",
  "demo": true
}
```

Validation failure (`400`):

```json
{
  "error": "Validation failed",
  "details": { "message": "Message must be 2000 characters or fewer." }
}
```

Provider failure (`502`):

```json
{
  "error": "The AI service is rate limited or out of quota. Please try again later ...",
  "provider": "openai"
}
```

Rules: `message` must be a non-empty string of at most 2000 characters (after trim); `provider` must be `openai`, `gemini` or `demo`; `sessionId` must be a 1–100 character string. `401/403`, `429`, timeouts and network errors from the upstream provider are mapped to plain-English messages — raw upstream bodies are never returned.

### `DELETE /api/chat/:sessionId`

Clears that session's history. Returns `204` with no body.

## 6. How to test

Use the UI, or run this from a second terminal while the dev server is up (do not assume `curl` is installed):

```bash
node -e "fetch('http://localhost:5003/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'How do I apply?'})}).then(r=>r.json()).then(console.log)"
```

1. **Supported question:** ask "How do I apply?" — you get a helpful answer under 120 words.
2. **Context follow-up:** ask "Tell me about hostels", then "What about the food?" — the second answer is still about hostels (works in demo mode too).
3. **Unknown question:** ask "Who is the dean of the law school?" — the bot says it doesn't know and points to `admissions@platypus.example.edu`, with no invented names, dates or fees.
4. **Reset:** click **Reset conversation** — the chat clears, the suggestion chips return, and the DELETE endpoint returns `204`.
5. **Validation:** send an empty message or one over 2000 characters — the server replies `400` with `details.message`.

## 7. Troubleshooting

- **Port already in use:** change `PORT` in `.env`, and update the proxy target in `vite.config.js` to match. (Port 5000 is intentionally avoided because macOS AirPlay reserves it.)
- **HTTP 429 / quota errors:** try again later, or set `GEMINI_MODEL` to a lighter flash-lite model, which has generous free-tier limits.
- **"Demo mode" banner appears:** no API key was detected. Add your key to `.env` and **restart the dev server** for it to take effect.
- **Real AI calls fail only in bolt.new:** some browser sandbox runtimes restrict outbound requests. Run the project locally with the same `.env` — the server code is identical.

## 8. Project structure

```
├── index.html                 Vite entry page
├── package.json               Single root package (client + server)
├── vite.config.js             Vite config; proxies /api to Express
├── .env.example               Copy to .env and add keys (optional)
├── server/
│   ├── index.js               Express setup, JSON parser, mounts routes
│   ├── routes/chat.js         Chat endpoints (POST, DELETE, config)
│   └── lib/
│       ├── ai.js              Provider layer: openai, gemini, demo + fallbacks
│       ├── systemPrompt.js    Persona text sent as the system prompt
│       ├── sessions.js        In-memory session store with trimming/expiry
│       ├── demoFaq.js         Keyword-based FAQ for demo mode
│       └── constants.js       Shared defaults (models, token cap, timeout)
└── src/
    ├── main.jsx               React entry point
    ├── App.jsx                App state: messages, session, loading
    ├── styles.css             All styling (plain CSS)
    └── components/
        ├── Header.jsx         Title, provider badge, reset button
        ├── ChatWindow.jsx     Message list, auto-scroll, send/error logic
        ├── ChatInput.jsx      Textarea, send button, char counter
        ├── MessageBubble.jsx  One chat bubble (user right, bot left)
        ├── TypingIndicator.jsx Animated dots while waiting
        └── SuggestionChips.jsx Four starter questions for empty chats
```
