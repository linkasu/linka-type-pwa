# State and Offline

## Pinia stores
- `stores/auth.ts`
  - Holds `user`, `token`, and auth state.
  - Token is in memory only; user is persisted in localStorage.
  - `initializeAuth()` refreshes token when online.
- `stores/user.ts`
  - Tracks `inited` and `preferences` from backend.
  - Applies preferences to `settingsStore` on load.
- `stores/settings.ts`
  - Local UI and TTS preferences.
  - Persists to localStorage and syncs to backend (debounced).
- `stores/categories.ts` and `stores/statements.ts`
  - Core bank data with optimistic updates.
  - Loads from IndexedDB cache and queues offline writes.
- `stores/quickes.ts`
  - Quick phrases (6 items) with optimistic updates and cache.
- `stores/offlineQueue.ts`
  - Flushes queued offline operations when back online.
- `stores/realtime.ts`
  - State container for potential realtime sync (not yet wired).

## Offline cache
IndexedDB is used for offline and fast startup.
- DB name: `linka-offline`
- Stores: `categories`, `statements`, `quickes`, `queue`
- Access helpers: `utils/offlineDb.ts`

## Offline write behavior
- When offline, CRUD operations are queued and applied locally:
  - Categories and statements get temp IDs (`generateTempId`).
  - Queue entries store the intent and payload.
- `stores/offlineQueue.ts` flushes in order when online:
  - Creates map temp ID -> real ID
  - Updates later queue items with remapped IDs
  - Deletes queue entries as they succeed

## Settings sync
- Settings are debounced (`SYNC_DEBOUNCE_MS`).
- If offline, preferences are queued as `user_prefs_update`.
- `settingsStore` applies local changes immediately and syncs later.

## Cache TTL
- Categories have a 5 minute cache TTL (`CACHE_TTL` in `stores/categories.ts`).
- Statements are cached per category and tracked in `loadedCategories`.

## Edge cases to preserve
- Offline login is allowed if `user` exists but token is missing.
- Queue flushing requires a valid access token; refresh is attempted.
- When replacing temp IDs, statements and queued ops must be updated.
