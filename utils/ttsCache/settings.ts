import {
  DEFAULT_CACHE_LIMIT_MB,
  META_STORE,
} from './constants'
import {
  isIdbAvailable,
  openDb,
  requestToPromise,
} from './db'
import type { CacheMeta } from './types'

export const getCacheEnabled = async (): Promise<boolean> => {
  if (!isIdbAvailable()) return true

  try {
    const db = await openDb()
    const tx = db.transaction(META_STORE, 'readonly')
    const store = tx.objectStore(META_STORE)
    const meta = await requestToPromise<CacheMeta | undefined>(store.get('settings'))
    return meta?.enabled ?? true
  } catch {
    return true
  }
}

export const setCacheEnabled = async (enabled: boolean): Promise<void> => {
  if (!isIdbAvailable()) return

  try {
    const db = await openDb()
    const tx = db.transaction(META_STORE, 'readwrite')
    const store = tx.objectStore(META_STORE)
    const meta = await requestToPromise<CacheMeta | undefined>(store.get('settings'))

    await requestToPromise(
      store.put({
        id: 'settings',
        enabled,
        sizeLimitMb: meta?.sizeLimitMb ?? DEFAULT_CACHE_LIMIT_MB,
      }),
    )
  } catch {
    // Ignore errors
  }
}

export const getCacheSizeLimitMb = async (): Promise<number> => {
  if (!isIdbAvailable()) return DEFAULT_CACHE_LIMIT_MB

  try {
    const db = await openDb()
    const tx = db.transaction(META_STORE, 'readonly')
    const store = tx.objectStore(META_STORE)
    const meta = await requestToPromise<CacheMeta | undefined>(store.get('settings'))
    return meta?.sizeLimitMb ?? DEFAULT_CACHE_LIMIT_MB
  } catch {
    return DEFAULT_CACHE_LIMIT_MB
  }
}

export const setCacheSizeLimitMb = async (limitMb: number): Promise<void> => {
  if (!isIdbAvailable()) return

  try {
    const db = await openDb()
    const tx = db.transaction(META_STORE, 'readwrite')
    const store = tx.objectStore(META_STORE)
    const meta = await requestToPromise<CacheMeta | undefined>(store.get('settings'))

    await requestToPromise(
      store.put({
        id: 'settings',
        enabled: meta?.enabled ?? true,
        sizeLimitMb: Math.max(0, limitMb),
      }),
    )
  } catch {
    // Ignore errors
  }
}
