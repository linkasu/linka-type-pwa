# Data Models

All types are defined in `types/api.ts` and `types/index.ts`.

## User
- `User`: `{ id, email, createdAt? }`
- `UserState`: `{ inited: boolean, preferences: UserPreferences }`
- `UserPreferences` fields:
  - `darkTheme`, `yandex`, `voiceUri?`, `yandexVoice?`
  - `volume`, `rate`, `pitch`
  - `showPredictor`, `showQuickes`, `showBank`
  - `saveOnSay`, `typeSound`, `speakLastWord`

## Bank
- `Category`:
  - `id`, `label`, `created`, `default`
  - `statementsCount?` from backend
- `Statement`:
  - `id`, `categoryId`, `text`, `created`
- Relationship: one category has many statements.

## Quickes
- `QuickPhrase` is `string[]`.
- UI expects 6 items (see `stores/quickes.ts` and `types/index.ts`).

## TTS
- `Voice` (backend): `{ id, name, lang, gender, engine }`
- `TTSRequest`: `{ text, voice, speed? }`

## Onboarding
- `Question`: `{ id, text, type, options? }`
- `OnboardingResult`: `{ categories: [{ label, statements[] }] }`

## Realtime
- `RealtimeChange` and `ChangeType` are defined, but not currently wired to a transport.

## Normalization rules
- Backend responses may use snake_case:
  - `created_at` -> `created`
  - `is_default` -> `default`
  - `statements_count` -> `statementsCount`
  - `category_id` -> `categoryId`
- Normalizers live in `api/normalize.ts`.

## Offline queue payloads
- Operations include category/statement CRUD, quickes update, and user prefs update.
- Types defined in `types/offline.ts`.
- Queue items are stored in IndexedDB via `utils/offlineDb.ts`.
