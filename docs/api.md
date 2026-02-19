# API and Backend

## API layers
- Client API modules: `api/*.ts`
  - Use `getApiClient()` from `api/client.ts` (Axios).
  - Exposed to app via `useAppServices().api`.
- Desktop bridge transport:
  - `electron/main.ts` exposes `window.desktop.backend.request`.
  - `api/client.ts` switches to desktop adapter when bridge is available.

## Base URL
- Backend base URL: `API_BASE_URL` env var
- Default: `https://backend.linka.su`

## Auth endpoints
- `/v1/auth` (login)
- `/v1/auth/register`
- `/v1/auth/refresh`
- `/v1/auth/logout`

Access token is stored in Pinia only. Refresh token is managed in desktop auth flow.

## Main resource endpoints
Client uses these via `api`:
- Categories: `/v1/categories` and `/v1/categories/:id`
- Statements: `/v1/statements` and `/v1/statements/:id`
- Statements by category: `/v1/categories/:id/statements`
- Quickes: `/v1/quickes`
- User state: `/v1/user/state` (GET/PUT)
- Global import: `/v1/global/categories`, `/v1/global/categories/:id/statements`, `/v1/global/import`
- TTS: `/v1/tts` and `/v1/voices`
- Predictor: `/v1/predictor`
- Onboarding: `/v1/onboarding/phrases`
- Factory questions: `/v1/factory/questions`

## Axios behavior
`api/client.ts` adds the Bearer token to requests and:
- On 401, attempts refresh once unless the request is auth-related.
- On 5xx, retries once with a 1s delay.
- Converts backend `{ error: { code, message } }` to JS `Error`.

## Normalization
- Categories and statements are normalized for snake_case fields in `api/normalize.ts`.
- Ensure new fields are normalized if backend adds them.

## Transport notes
- Desktop backend requests include `X-Client-Type: native`.
- `api/client.ts` maps backend `{ error: { code, message } }` into `Error`.
