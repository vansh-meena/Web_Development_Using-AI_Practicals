# Lumora

Lumora is a full-stack AI image web app that **generates images from text** and **writes captions for uploaded photos**. It runs entirely in bolt.new (WebContainers) or locally with a single command, and is fully demonstrable with no API keys thanks to a built-in demo provider.

## Features

- **Text-to-image generation** with six styles (Photorealistic, 3D Render, Watercolor, Anime, Neon, Pixel Art) and three aspect ratios (Square, Portrait, Landscape).
- **Photo captioning** via Google Gemini (when a key is provided).
- **Prompt enhancement** that rewrites a short prompt into a richer descriptive paragraph.
- **Three providers** for image generation:
  - **Pollinations** (default, no key) — the server builds a URL and the browser loads the image.
  - **OpenAI** (key required) — server-side call to OpenAI's image API; costs money per image.
  - **Demo** (no key, no network) — deterministic SVG placeholders generated locally.
- **Provider selection**: an explicit request overrides `IMAGE_PROVIDER` env, which overrides the default (pollinations). OpenAI is never auto-selected and is disabled in the UI when no key is configured.
- **Seed behaviour**: an optional integer seed makes generation reproducible. If omitted, a random seed is generated and returned. **OpenAI ignores the seed** — the response still returns a seed and reports `seedSupported: false`.
- **Demo behaviour**: demo images are deterministic SVGs. The same prompt + style + aspect + seed always yields the identical SVG. Different seeds produce visibly different images.

## Running in bolt.new

1. Open the project in bolt.new.
2. If it does not start by itself, run:
   ```
   npm install
   npm run dev
   ```
3. **Demo mode works immediately** with no configuration. The demo provider generates SVG placeholders, and Pollinations works if bolt's network allows outbound calls.
4. For real AI generation, copy `.env.example` to `.env`, add your keys, and restart the dev server.
5. **Do not share or publish a bolt project containing real API keys.** `.env` is gitignored — but if you publish a bolt project, the environment is shared. Use a fresh project for anything public.
6. Note that bolt's browser runtime may block some outbound API calls; if Pollinations or OpenAI images do not load, switch to the demo provider.

## Running locally

Requires **Node 18+** (LTS recommended).

```
npm install
cp .env.example .env      # then optionally add keys
npm run dev
```

Open the Vite URL (usually http://localhost:5173). The Express server runs on port 5005 and Vite proxies `/api` requests to it.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Express server port (do not use 5000 — macOS AirPlay uses it) | `5005` |
| `IMAGE_PROVIDER` | Default image provider: `pollinations` / `openai` / `demo` | `pollinations` |
| `OPENAI_API_KEY` | OpenAI API key (optional; required for OpenAI images and as a text-enhance fallback) | _(none)_ |
| `OPENAI_IMAGE_MODEL` | OpenAI image model | `gpt-image-1` |
| `OPENAI_TEXT_MODEL` | OpenAI text model used for prompt enhancement | `gpt-4o-mini` |
| `GEMINI_API_KEY` | Google Gemini API key (optional; required for captioning and preferred for enhance) | _(none)_ |
| `GEMINI_MODEL` | Gemini model (must support image input for captioning) | `gemini-2.0-flash-lite` |
| `POLLINATIONS_BASE_URL` | Pollinations image endpoint | `https://image.pollinations.ai/prompt/` |

API keys stay on the server and are never sent to the browser or logged.

## API reference

Base URL: `http://localhost:5005` (or via the Vite proxy at `http://localhost:5173/api`).

### `GET /api/health`
```json
{ "status": "ok" }
```

### `GET /api/image/config`
Returns available providers, styles, aspects, whether captioning is available, and the enhance source.
```json
{
  "defaultProvider": "pollinations",
  "availableProviders": [
    { "id": "pollinations", "label": "Pollinations", "available": true },
    { "id": "openai", "label": "OpenAI", "available": false },
    { "id": "demo", "label": "Demo", "available": true }
  ],
  "captionAvailable": false,
  "enhanceSource": "local",
  "styles": [{ "id": "photoreal", "label": "Photorealistic", "suffix": "..." }],
  "aspects": [{ "id": "square", "label": "Square", "width": 1024, "height": 1024 }]
}
```

### `POST /api/image/generate`
Body: `{ "prompt": "a dog on a hill", "style": "neon", "aspect": "landscape", "seed": 123, "provider": "pollinations" }`

Success (200):
```json
{
  "url": "https://image.pollinations.ai/prompt/...",
  "seed": 123,
  "provider": "pollinations",
  "model": "pollinations",
  "demo": false,
  "style": "neon",
  "aspect": "landscape",
  "width": 1152,
  "height": 768,
  "finalPrompt": "a dog on a hill, cyberpunk neon aesthetic, dramatic lighting, high contrast",
  "seedSupported": true,
  "downloadable": true
}
```

Validation failure (400):
```json
{ "error": "Validation failed", "details": { "prompt": "Prompt must be at least 3 characters.", "style": "Style must be one of: ..." } }
```

Provider failure (502):
```json
{ "error": "OpenAI API key is invalid or your account does not have access to this image model.", "provider": "openai" }
```

OpenAI requested without a key (400):
```json
{ "error": "OpenAI key not configured", "details": { "provider": "OpenAI key not configured" } }
```

### `POST /api/image/enhance`
Body: `{ "prompt": "a dog" }`
```json
{ "prompt": "a dog, soft golden-hour light, shot on a 50mm lens at f/1.8, serene and contemplative composition, rich color and fine detail.", "source": "local" }
```
When no keys are configured, the local offline enhancer is used and a `notice` field is included:
```json
{ "prompt": "...", "source": "local", "notice": "AI enhancement unavailable, used the offline enhancer." }
```

### `POST /api/image/caption`
Body: `{ "image": "data:image/jpeg;base64,...", "mimeType": "image/jpeg" }`
```json
{ "caption": "A golden retriever sits on a grassy hill at sunset.", "provider": "gemini", "model": "gemini-2.0-flash-lite" }
```
Without a Gemini key (503):
```json
{ "error": "Captioning needs GEMINI_API_KEY on the server." }
```
Validation failure (400):
```json
{ "error": "Validation failed", "details": { "mimeType": "mimeType must be one of: image/jpeg, image/png, image/webp." } }
```

### `GET /api/image/download?url=...`
SSRF-safe server-side proxy that streams an image as a download attachment. Only https URLs whose host matches Pollinations or OpenAI image hosts are allowed; everything else returns 400. Requires an `image/*` content type and caps size at 10 MB. Data URLs (demo and base64 results) are downloaded directly in the browser without this route.

## How to test

You can test from the UI, or use a `node -e` fetch one-liner (do not assume `curl` is available).

**Health:**
```
node -e "fetch('http://localhost:5005/api/health').then(r=>r.json()).then(console.log)"
```

**Config:**
```
node -e "fetch('http://localhost:5005/api/image/config').then(r=>r.json()).then(console.log)"
```

**Demo generation:**
```
node -e "fetch('http://localhost:5005/api/image/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'a dog on a hill',style:'neon',aspect:'landscape',provider:'demo'})}).then(r=>r.json()).then(console.log)"
```

**Seed reproducibility (demo):** run the same request twice with the same seed and the returned `url` is identical; change the seed and it differs.

**Enhance (local, no keys):**
```
node -e "fetch('http://localhost:5005/api/image/enhance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'a dog'})}).then(r=>r.json()).then(console.log)"
```

**Validation (all failing fields at once):**
```
node -e "fetch('http://localhost:5005/api/image/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'hi',style:'oil',aspect:'wide'})}).then(r=>r.json()).then(console.log)"
```

**Caption validation (gif / mismatched mime):**
```
node -e "fetch('http://localhost:5005/api/image/caption',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:'data:image/gif;base64,R0lGODlh',mimeType:'image/png'})}).then(r=>r.json()).then(console.log)"
```

**OpenAI without a key:**
```
node -e "fetch('http://localhost:5005/api/image/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'a dog',provider:'openai'})}).then(r=>r.json()).then(console.log)"
```

## Troubleshooting

- **Port in use**: change `PORT` in `.env` **and** the proxy target in `vite.config.js` to the same port.
- **Proxy ECONNREFUSED**: the Express server is not running, or the port in `.env` does not match the proxy in `vite.config.js`.
- **Pollinations images not loading**: the service may be unreachable or its rules changed. Use the demo provider and check `POLLINATIONS_BASE_URL`.
- **OpenAI model or size errors**: change `OPENAI_IMAGE_MODEL` in `.env`. The app maps each aspect to the nearest supported size, but a different model may accept different sizes.
- **429 quota errors**: you hit the OpenAI rate limit (5 image calls/min) or your account quota. Wait and retry, or use demo/pollinations.
- **Caption tab disabled**: no `GEMINI_API_KEY` is set. Add it to `.env` and restart.
- **Blank page**: open the browser console — the ErrorBoundary should show a readable message with a reload button.

## Project structure

```
server/
  index.js              Express setup, JSON parser (8mb), mounts routes
  routes/image.js       All /api/image endpoints (generate, enhance, caption, config, download)
  lib/styles.js         Style suffixes, aspect dimensions, OpenAI size map
  lib/imageProviders.js pollinations, openai, demo providers + OpenAI text enhance
  lib/demoSvg.js        Deterministic SVG generator
  lib/gemini.js         Gemini caption + text-enhance calls
  lib/enhanceLocal.js   Offline prompt enhancer
  lib/validate.js       Request validation (reports all failing fields)
  lib/rateLimit.js      Simple in-memory rate limiter
src/
  main.jsx              React entry point
  App.jsx               Top-level app, state, tab switching
  styles.css            All styles (plain CSS, no UI library)
  constants.js          Frontend style/aspect defaults
  components/
    ErrorBoundary.jsx   Catches errors, shows a readable message + reload
    Header.jsx          Brand, tabs, demo banner
    GenerateTab.jsx     Prompt, style, aspect, provider, seed, generate
    StyleGrid.jsx       Six style cards
    AspectSelector.jsx  Three aspect options with shape previews
    ImageStage.jsx      Image display, loading skeleton, errors, meta, download
    CaptionTab.jsx      Drag-and-drop upload, downscale, caption
    Gallery.jsx         Last 12 images with reuse/download
index.html
vite.config.js          Vite config with /api proxy to :5005
package.json            Single root manifest, dev runs server + client together
.env.example            Environment variable template
README.md
```
