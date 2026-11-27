# Vigil

A local application quality and security laboratory. Vigil is a self-contained Node.js application (no npm dependencies, no frameworks) that serves a professional testing console in the browser and a set of local demonstration endpoints that the console exercises with real HTTP requests.

## Requirements

- Node.js 18+
- No npm dependencies. No network access required.

## Run

```bash
npm start
```

Then open http://localhost:4010 in your browser. The port can be changed with the `PORT` environment variable:

```bash
PORT=5000 npm start
```

## Run the tests

```bash
npm test
```

The automated tests use `node --test` (no external test runner). Each test starts the server on an ephemeral port (port 0), issues native `fetch` requests, and closes the server. No network access is required.

## Architecture

- `server.js` — exports `createServer()` and starts listening when run directly via `npm start`.
- `src/router.js` — routes requests by `new URL(req.url, "http://localhost").pathname`, serves static files safely (confined to `public/`), and dispatches API endpoints.
- `src/validators.js` — input validation for `/api/records`.
- `src/security.js` — security headers applied to every response.
- `public/index.html`, `public/styles.css`, `public/app.js` — the browser console UI.
- `test/integration.test.js` — automated integration tests with `node:test`.

## Endpoints

| Method | Path           | Description |
|--------|----------------|-------------|
| GET    | `/api/health`  | `200 { "status": "ok" }` |
| POST   | `/api/records` | Accepts `{ name, email, note? }`, returns `200 { "ok": true, "record": {...} }` |
| *      | any other      | `404 { "error": "Not Found" }` |

### Validation rules for `/api/records`

- `name`: string, 1–80 characters after trimming, no `<` or `>`.
- `email`: string matching a reasonable email pattern.
- `note`: optional string, up to 500 characters, no `<` or `>`.
- Extra/unexpected keys, nested objects/arrays, and non-string values are rejected.
- Malformed JSON → `422`. Body over 10 KB → `413`.
- All validation errors return `422 { "error": "Validation Error", "details": { "<field>": "<message>" } }`.

### Security headers (on every response)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'`
- `Cross-Origin-Resource-Policy: same-origin`
- `Cache-Control: no-store` on API responses

## Expected test results

| # | Test | Request | Expected status |
|---|------|---------|-----------------|
| 1 | Health endpoint | `GET /api/health` | 200 |
| 2 | Valid record submission | `POST /api/records` | 200 |
| 3 | Empty name | `POST /api/records` | 422 |
| 4 | Malformed email | `POST /api/records` | 422 |
| 5 | HTML markup in a field | `POST /api/records` | 422 |
| 6 | Unexpected object input | `POST /api/records` | 422 |
| 7 | Unknown route | `GET /api/nope` | 404 |
| 8 | Security headers | `GET /api/health` | 200 (all headers present) |
| 9 | URL query regression | `GET /api/health?x=1` and `GET /api/health?next=/api/records` | 200 |

## Limitations

Vigil tests only this local application. Basic validation and header checks are not a comprehensive production security audit.
