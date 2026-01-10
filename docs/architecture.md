# Architecture

## Stack
- Nuxt 4 + Vue 3 Composition API
- Vuetify 3 UI library
- Pinia for state management
- @nuxtjs/i18n for localization
- @vite-pwa/nuxt for PWA + Workbox
- Axios for client API requests

## Runtime layers
1) Browser UI
- Pages, components, composables, and stores live in `pages/`, `components/`, `composables/`, `stores/`.
- The UI calls `$api` (see `plugins/api.ts`).

2) Nuxt server API proxy
- Server routes in `server/api/` forward requests to the backend (`API_BASE_URL`, default `https://backend.linka.su`).
- Auth routes manage refresh token cookies and enforce same-origin checks.

3) Backend service
- Not in this repo. All calls go through the Nuxt server proxy.

## Request flow (typical)
- Component or store calls `$api.X`.
- `$api` uses `api/client.ts` (Axios instance with auth interceptors).
- Requests go to `/api/...` (Nuxt server routes).
- Server route calls `backendRequest` in `server/utils/backend.ts`.
- Response is normalized (for categories/statements) in `api/normalize.ts`.

## Auth flow
- Login/register calls `/api/auth` or `/api/auth/register`.
- Server sets `refresh_token` httpOnly cookie (path `/api/auth`).
- Access token is stored in memory (Pinia store) and refreshed when needed.
- `api/client.ts` handles 401 refresh with a single retry; on failure it clears auth and redirects to `/login`.

## TTS flow
- `useTTS` selects provider based on `settingsStore.yandex`.
- Yandex TTS: calls `/api/tts`, returns a blob, plays or downloads.
- Browser TTS: uses `SpeechSynthesisUtterance` with `voiceUri`, rate, pitch, volume.
- Voice list for Yandex is loaded from `/api/voices`.

## Predictor flow
- `components/Predictor.vue` watches input with debounce (300ms).
- Calls `/api/predictor?q=...` and renders up to 5 suggestions.
- Alt/Cmd + 1-5 selects a prediction.

## PWA behavior
- Config in `nuxt.config.ts` under `pwa`.
- Workbox caches static assets and uses NetworkFirst for `/api`.
- Manifest and icons live in `public/icons`.

## Localization
- i18n keys are used via `t('...')` in components.
- Locale JSON exists in `locales/` and `i18n/locales/`. Check which is active and keep in sync if both are used.
