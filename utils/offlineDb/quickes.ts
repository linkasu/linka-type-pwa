import {
  CachedQuickes,
  STORES,
  isIdbAvailable,
  requestToPromise,
  withStore,
} from './core'

export const getQuickes = async (userId: string): Promise<string[] | null> => {
  if (!isIdbAvailable()) return null
  return withStore(STORES.quickes, 'readonly', async (store) => {
    const record = await requestToPromise<CachedQuickes | undefined>(store.get(userId))
    return record?.quickes ?? null
  })
}

export const setQuickes = async (userId: string, quickes: string[]): Promise<void> => {
  if (!isIdbAvailable()) return
  const safeQuickes = Array.isArray(quickes) ? Array.from(quickes) : []
  await withStore(STORES.quickes, 'readwrite', async (store) => {
    store.put({ userId, quickes: safeQuickes } satisfies CachedQuickes)
    return Promise.resolve()
  })
}
