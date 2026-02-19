# Architecture

## Stack
- Electron + Vite + Vue 3 Composition API
- Vuetify 3 UI library
- Pinia for state management
- vue-i18n for localization
- Axios for client API requests

## Runtime layers
1) Renderer UI
- Pages, components, composables, and stores live in `pages/`, `components/`, `composables/`, `stores/`.
- The UI calls `api` via `useAppServices()` (see `src/renderer/app-context.ts` and `plugins/api.ts`).

2) Electron main process bridge
- Desktop runtime uses `window.desktop.backend.request(...)` bridge.
- `api/client.ts` can use bridge adapter or direct HTTP transport.

3) Backend service
- Not in this repo. Base URL is `API_BASE_URL` (default `https://backend.linka.su`).

## Request flow (typical)
- Component or store calls `api.X`.
- API modules use `api/client.ts` (Axios instance with auth interceptors).
- Requests go to `${API_BASE_URL}/v1/...` (or through desktop bridge).
- Response is normalized (for categories/statements) in `api/normalize.ts`.

## Auth flow
- Login/register calls backend `/v1/auth` endpoints.
- Refresh token is persisted locally in desktop mode.
- Access token is stored in memory (Pinia store) and refreshed when needed.
- `api/client.ts` handles 401 refresh with a single retry; on failure it clears auth and redirects to `/login`.

## TTS flow
- `useTTS` selects provider based on `settingsStore.yandex`.
- Yandex TTS: calls backend TTS endpoint, returns a blob, plays or downloads.
- Browser TTS: uses `SpeechSynthesisUtterance` with `voiceUri`, rate, pitch, volume.
- Voice list for Yandex is loaded via `api.tts.getVoices()`.

## Predictor flow
- `components/Predictor.vue` watches input with debounce (300ms).
- Calls `/api/predictor?q=...` and renders up to 5 suggestions.
- Alt/Cmd + 1-5 selects a prediction.

## Entrypoints
- `index.html` is the public download landing page (`type.linka.su`).
- `app.html` is the renderer entrypoint used by desktop app.

## Localization
- i18n keys are used via `t('...')` in components.
- Locale JSON exists in `locales/` and `i18n/locales/`. Check which is active and keep in sync if both are used.
