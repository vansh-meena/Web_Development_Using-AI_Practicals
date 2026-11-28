# NoteLens

NoteLens is an AI study notes summarizer. Paste your lecture notes or textbook passages, pick a summary style, and get a clean, focused summary you can copy and save. Your summaries are stored under your account, so you can revisit them any time.

## What it does

- Summarizes study notes (50 to 6000 characters) into one of four styles: bullet points, short paragraph, key terms, or exam questions.
- Short or Medium length toggle.
- Saves every summary to your personal history (up to 50 most recent shown).
- Copy any summary to your clipboard.
- Runs in **demo mode** when no Gemini API key is set, so the app stays fully usable with a deterministic extractive summary.

## Stack

- Frontend: plain HTML, CSS, and JavaScript (no framework).
- Backend: Express.js (Node 18+, CommonJS).
- Database and auth: Supabase.
- AI text generation: Google Gemini via native `fetch`.

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL. |
| `SUPABASE_ANON_KEY` | Your Supabase anon public key. |
| `GEMINI_API_KEY` | Your Google Gemini API key. If omitted, the app runs in demo mode. |
| `GEMINI_MODEL` | Gemini model name. Defaults to `gemini-flash-latest`. |
| `PORT` | Port for local dev. Defaults to `4012`. |

> **Never commit your `.env` file.** It is gitignored and contains secrets.

## Run locally

```bash
npm install
cp .env.example .env   # then edit .env with your values
npm start
```

Open http://localhost:4012 in your browser.

## Deploy to Vercel

No extra configuration is needed.

1. Push this repository to GitHub.
2. In Vercel, import the repository. Vercel auto-detects the Express app.
3. Add the environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`) in the Vercel project settings.
4. Deploy. The `public/` folder is served by the Vercel CDN and the Express API runs as a serverless function.

## Database

The app expects a `public.notes` table with columns: `id`, `user_id`, `title`, `source_text`, `summary`, `style`, `length`, `model`, `is_demo`, `created_at`. Row Level Security restricts every user to their own rows. The database is assumed to already exist; this project does not create or alter it.
