# Kisan Mandi crop quality API

The Express API accepts a crop photo at `POST /api/analyze` and sends it to Gemini's Interactions API using the server-side `GEMINI_API_KEY`. It listens on port `3001` by default; `GET /api/health` reports readiness without returning secrets.

## Environment

Copy `.env.example` to `.env` and set `GEMINI_API_KEY` locally. `GEMINI_MODEL` defaults to `gemini-3.8-flash`. If that model is quota-limited or temporarily busy, the API retries once with `GEMINI_FALLBACK_MODEL` (`gemini-flash-lite-latest` by default). `PORT` defaults to `3001`. `CORS_ORIGINS` is a comma-separated list of allowed frontend origins.

The application also loads the existing legacy `src/server/.env` when `server/.env` is not present. Prefer `server/.env` for this backend. Both locations are excluded from Git.

The frontend defaults to `http://localhost:3001`. To use another backend URL, set `VITE_CROP_AI_API_URL` in the frontend environment before starting Vite.

## Run locally

From the repository root, run in separate PowerShell terminals:

```powershell
npm --prefix .\server run dev
npm run dev
```

Open `http://localhost:8080`, choose **AI Crop Quality Check** from the Modules menu, then capture or upload a JPEG, PNG, or WebP image smaller than 8 MB.

The analysis is a non-certified visual estimate. It is not a laboratory test, food-safety assessment, or disease diagnosis.
