# API and Backend

## API layers
- Client API modules: `api/*.ts`
  - Use `getApiClient()` from `api/client.ts` (Axios).
  - Exposed to app via `$api` in `plugins/api.ts`.
- Server API routes: `server/api/*`
  - Run on Nuxt server and forward to backend.
  - Use `backendRequest()` helper.

## Base URL
- Backend base URL: `API_BASE_URL` env var
- Default: `https://backend.linka.su`

## Auth endpoints
- `/api/auth` (login)
- `/api/auth/register`
- `/api/auth/refresh`
- `/api/auth/logout`

Server routes set `refresh_token` cookie and enforce same-origin on refresh/logout.
Access token is returned in JSON and stored in Pinia only.

## Main resource endpoints
Client uses these via `$api`:
- Categories: `/api/categories` and `/api/categories/:id`
- Statements: `/api/statements` and `/api/statements/:id`
- Statements by category: `/api/categories/:id/statements`
- Quickes: `/api/quickes`
- User state: `/api/user/state` (GET/PUT)
- Global import: `/api/global/categories`, `/api/global/categories/:id/statements`, `/api/global/import`
- TTS: `/api/tts` and `/api/voices`
- Predictor: `/api/predictor?q=...`
- Onboarding: `/api/onboarding/phrases`
- Factory questions: `/api/factory/questions`

## Axios behavior
`api/client.ts` adds the Bearer token to requests and:
- On 401, attempts refresh once unless the request is auth-related.
- On 5xx, retries once with a 1s delay.
- Converts backend `{ error: { code, message } }` to JS `Error`.

## Normalization
- Categories and statements are normalized for snake_case fields in `api/normalize.ts`.
- Ensure new fields are normalized if backend adds them.

## Security helpers
- `server/utils/security.ts` checks same-origin for sensitive routes.
- `server/utils/backend.ts` builds headers, forwards auth, and normalizes errors.
