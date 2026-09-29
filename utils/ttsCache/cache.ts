import {
  DEFAULT_CACHE_LIMIT_MB,
  MEGABYTE,
  META_STORE,
  STORE_NAME,
} from './constants'
import {
  isIdbAvailable,
  openDb,
  requestToPromise,
} from './db'
import {
  getCacheEnabled,
  getCacheSizeLimitMb,
} from './settings'
import type {
  CachedAudio,
  CacheMeta,
  TtsCacheInfo,
} from './types'

export const generateCacheKey = (text: string, voice: string, rate: number): string => {
  const source = `${voice}:${rate}:${text}`
  let hash = 0
  for (let i = 0; i < source.length; i += 1) {
    const char = source.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash
  }
  return `v2-${Math.abs(hash).toString(16).padStart(8, '0')}`
}

export const getCachedAudio = async (cacheKey: string): Promise<Blob | null> => {
  if (!isIdbAvailable() || !(await getCacheEnabled())) return null

  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const record = await requestToPromise<CachedAudio | undefined>(store.get(cacheKey))
    if (!record) return null

    record.lastUsedAt = Date.now()
    store.put(record)
    return record.blob
  } catch {
    return null
  }
}

export const isCached = async (cacheKey: string): Promise<boolean> => {
  if (!isIdbAvailable() || !(await getCacheEnabled())) return false

  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const count = await requestToPromise(store.count(cacheKey))
    return count > 0
  } catch {
    return false
  }
}

const ensureCacheLimit = async (pendingAdditionBytes: number): Promise<void> => {
  if (!isIdbAvailable()) return

  try {
    const limitMb = await getCacheSizeLimitMb()
    const limitBytes = limitMb * MEGABYTE
    if (limitBytes <= 0) return

    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const index = tx.objectStore(STORE_NAME).index('byLastUsed')

    let currentSize = 0
    const oldestRecords: Array<Pick<CachedAudio, 'key' | 'size'>> = []
    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) return resolve()
        const record = cursor.value as CachedAudio
        currentSize += record.size
        oldestRecords.push({ key: record.key, size: record.size })
        cursor.continue()
      }
    })

    if (currentSize + pendingAdditionBytes <= limitBytes) return

    const keysToDelete: string[] = []
    for (const record of oldestRecords) {
      if (currentSize + pendingAdditionBytes <= limitBytes) break
      keysToDelete.push(record.key)
      currentSize -= record.size
    }

    const deleteTx = db.transaction(STORE_NAME, 'readwrite')
    const deleteStore = deleteTx.objectStore(STORE_NAME)
    await Promise.all(keysToDelete.map(key => requestToPromise(deleteStore.delete(key))))
  } catch {
    // Ignore errors
  }
}

export const saveToCache = async (
  cacheKey: string,
  text: string,
  voice: string,
  blob: Blob,
): Promise<boolean> => {
  if (!isIdbAvailable()) return false

  const enabled = await getCacheEnabled()
  if (!enabled) return false

  try {
    await ensureCacheLimit(blob.size)

    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const record: CachedAudio = {
      key: cacheKey,
      voice,
      text,
      blob,
      size: blob.size,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    }

    await requestToPromise(store.put(record))
    return true
  } catch {
    return false
  }
}

export const getCacheInfo = async (): Promise<TtsCacheInfo> => {
  const defaultInfo: TtsCacheInfo = {
    enabled: true,
    sizeMb: 0,
    sizeLimitMb: DEFAULT_CACHE_LIMIT_MB,
    fileCount: 0,
    usagePercentage: 0,
    isNearLimit: false,
  }

  if (!isIdbAvailable()) return defaultInfo

  try {
    const db = await openDb()
    const tx = db.transaction([STORE_NAME, META_STORE], 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const metaStore = tx.objectStore(META_STORE)

    const [allRecords, meta] = await Promise.all([
      requestToPromise<CachedAudio[]>(store.getAll()),
      requestToPromise<CacheMeta | undefined>(metaStore.get('settings')),
    ])

    const totalSize = allRecords.reduce((sum, record) => sum + record.size, 0)
    const sizeMb = totalSize / MEGABYTE
    const sizeLimitMb = meta?.sizeLimitMb ?? DEFAULT_CACHE_LIMIT_MB
    const enabled = meta?.enabled ?? true
    const usagePercentage = sizeLimitMb > 0 ? (sizeMb / sizeLimitMb) * 100 : 0

    return {
      enabled,
      sizeMb,
      sizeLimitMb,
      fileCount: allRecords.length,
      usagePercentage,
      isNearLimit: usagePercentage >= 90,
    }
  } catch {
    return defaultInfo
  }
}

export const clearCache = async (): Promise<void> => {
  if (!isIdbAvailable()) return

  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await requestToPromise(store.clear())
  } catch {
    // Ignore errors
  }
}
