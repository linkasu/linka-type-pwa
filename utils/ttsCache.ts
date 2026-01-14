const DB_NAME = 'linka-tts-cache'
const DB_VERSION = 1
const STORE_NAME = 'audio'
const META_STORE = 'meta'

const DEFAULT_CACHE_LIMIT_MB = 500
const MEGABYTE = 1024 * 1024

interface CachedAudio {
  key: string
  voice: string
  text: string
  blob: Blob
  size: number
  createdAt: number
  lastUsedAt: number
}

interface CacheMeta {
  id: 'settings'
  enabled: boolean
  sizeLimitMb: number
}

export interface TtsCacheInfo {
  enabled: boolean
  sizeMb: number
  sizeLimitMb: number
  fileCount: number
  usagePercentage: number
  isNearLimit: boolean
}

let dbPromise: Promise<IDBDatabase> | null = null

const isIdbAvailable = (): boolean => typeof indexedDB !== 'undefined'

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const openDb = async (): Promise<IDBDatabase> => {
  if (!isIdbAvailable()) {
    throw new Error('IndexedDB not available')
  }
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        store.createIndex('byLastUsed', 'lastUsedAt', { unique: false })
        store.createIndex('byCreatedAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

export function generateCacheKey(text: string, voice: string): string {
  const source = `${voice}:${text}`
  let hash = 0
  for (let i = 0; i < source.length; i++) {
    const char = source.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

export async function getCachedAudio(cacheKey: string): Promise<Blob | null> {
  if (!isIdbAvailable()) return null

  try {
    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const record = await requestToPromise<CachedAudio | undefined>(store.get(cacheKey))

    if (record) {
      record.lastUsedAt = Date.now()
      store.put(record)
      return record.blob
    }

    return null
  } catch {
    return null
  }
}

export async function isCached(cacheKey: string): Promise<boolean> {
  if (!isIdbAvailable()) return false

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

export async function saveToCache(
  cacheKey: string,
  text: string,
  voice: string,
  blob: Blob
): Promise<boolean> {
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

export async function getCacheInfo(): Promise<TtsCacheInfo> {
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

    const totalSize = allRecords.reduce((sum, r) => sum + r.size, 0)
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

export async function clearCache(): Promise<void> {
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

export async function getCacheEnabled(): Promise<boolean> {
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

export async function setCacheEnabled(enabled: boolean): Promise<void> {
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
      })
    )
  } catch {
    // Ignore errors
  }
}

export async function getCacheSizeLimitMb(): Promise<number> {
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

export async function setCacheSizeLimitMb(limitMb: number): Promise<void> {
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
      })
    )
  } catch {
    // Ignore errors
  }
}

async function ensureCacheLimit(pendingAdditionBytes: number): Promise<void> {
  if (!isIdbAvailable()) return

  try {
    const limitMb = await getCacheSizeLimitMb()
    const limitBytes = limitMb * MEGABYTE
    if (limitBytes <= 0) return

    const db = await openDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('byLastUsed')

    const allRecords = await requestToPromise<CachedAudio[]>(index.getAll())
    let currentSize = allRecords.reduce((sum, r) => sum + r.size, 0)

    if (currentSize + pendingAdditionBytes <= limitBytes) return

    // Sort by lastUsedAt ascending (oldest first)
    allRecords.sort((a, b) => a.lastUsedAt - b.lastUsedAt)

    for (const record of allRecords) {
      if (currentSize + pendingAdditionBytes <= limitBytes) break
      store.delete(record.key)
      currentSize -= record.size
    }
  } catch {
    // Ignore errors
  }
}

export async function preloadPhrases(
  phrases: string[],
  voice: string,
  synthesize: (text: string, voice: string) => Promise<Blob>,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const total = phrases.length

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i]
    const cacheKey = generateCacheKey(phrase, voice)

    if (!(await isCached(cacheKey))) {
      try {
        const blob = await synthesize(phrase, voice)
        await saveToCache(cacheKey, phrase, voice, blob)
      } catch {
        // Continue with next phrase
      }
    }

    onProgress?.(i + 1, total)
  }
}
