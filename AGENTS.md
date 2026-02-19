# AGENTS.md

This repo is the LINKa Type PWA v2 (Electron + Vite + Vue 3 + Vuetify). It is a communication app for users with speech impairments: type text, speak via TTS, use quick phrases, and manage a phrase bank with categories.

Use this file as guardrails when making changes.

## Quick product map
- Entry flow: `/` -> `/login` or `/main` depending on auth and refresh token
- Auth: email/password, refresh token stored locally for desktop mode, access token in memory
- Setup: `/setup` onboarding stepper (voice settings + mark user initialized)
- Main: `/main` input + predictor + quick phrases + bank + spotlight
- Settings: `/settings` tabs for voice, adaptive options, import, account

## Architecture (high level)
- Client UI: `pages/`, `components/`, `layouts/`, `composables/`
- State: Pinia stores in `stores/`
- API client: `api/` uses Axios via `api/client.ts`
- Offline: IndexedDB cache + offline queue in `utils/offlineDb.ts` and `stores/offlineQueue.ts`

## Core data model
- Category: container for statements (bank)
- Statement: a phrase in a category
- Quickes: fixed-length array (6) of quick phrases
- UserPreferences: voice + UI + behavior settings
- UserState: `{ inited, preferences }` to gate setup

## Do and donts for agents
- Use `api` from `useAppServices()` for all API calls. Do not call backend URLs directly from components.
- For new settings or preferences:
  - Update `types/api.ts` + `types/index.ts` defaults
  - Add key to `stores/settings.ts` `PREFERENCE_KEYS`
  - Ensure it is synced or queued offline
- For categories/statements changes, use the stores. They handle optimistic updates, offline queueing, and ID remapping.
- Keep offline behavior intact. If you add a new offline operation, extend:
  - `types/offline.ts`
  - `utils/offlineDb.ts` queue handling
  - `stores/offlineQueue.ts` flush logic
- If you add or change keyboard shortcuts:
  - Update `types/shortcuts.ts`
  - Update i18n keys in locale files
- Locale files exist in both `locales/` and `i18n/locales/`. Verify which `langDir` is active and keep them in sync if both are used.

## Auth and tokens
- `authStore` keeps user in localStorage but token only in memory.
- Refresh token is stored locally for desktop mode.
- `api/client.ts` handles 401 refresh with one retry and maps backend errors.

## Offline support
- IndexedDB database `linka-offline` stores categories, statements, quickes, and a queue.
- When offline, create/update/delete writes to local cache and queue.
- `stores/offlineQueue.ts` flushes and remaps temp IDs when online.
- `plugins/offline.client.ts` hydrates queue and flushes on online events.

## UI and behavior notes
- Main input supports Ctrl/Cmd + Enter for newline, Enter to speak.
- Spotlight is full-screen input (Ctrl/Cmd + B).
- Bank supports keyboard selection using `QWERTY_MAP`.
- Reader mode is full-screen TTS with keyboard navigation.
- Type sound uses `public/sounds/type.wav`.

## Local dev
- `npm run dev` starts Vite renderer on `http://127.0.0.1:5173` and launches Electron.
- `dev.sh` can generate SSL certs and run Docker dev stack.
- Env: `API_BASE_URL`, `PREDICTOR_API_KEY` (optional)

## Testing
- No automated test suite is wired. If you add tests, document how to run them.
