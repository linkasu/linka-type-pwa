import type { UserPreferences } from '~/types/api'
import {
  CachedUserState,
  STORES,
  isIdbAvailable,
  requestToPromise,
  withStore,
} from './core'

export const getUserState = async (
  userId: string,
): Promise<{ inited: boolean; preferences: UserPreferences } | null> => {
  if (!isIdbAvailable()) return null
  return withStore(STORES.userState, 'readonly', async (store) => {
    const record = await requestToPromise<CachedUserState | undefined>(store.get(userId))
    if (!record) return null
    return { inited: record.inited, preferences: record.preferences }
  })
}

export const setUserState = async (
  userId: string,
  state: { inited: boolean; preferences: UserPreferences },
): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.userState, 'readwrite', async (store) => {
    store.put({
      userId,
      inited: state.inited,
      preferences: state.preferences,
      updatedAt: Date.now(),
    } satisfies CachedUserState)
    return Promise.resolve()
  })
}
