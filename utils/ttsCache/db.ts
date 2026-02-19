import {
  DB_NAME,
  DB_VERSION,
  META_STORE,
  STORE_NAME,
} from './constants'

let dbPromise: Promise<IDBDatabase> | null = null

export const isIdbAvailable = (): boolean => typeof indexedDB !== 'undefined'

export const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

export const openDb = async (): Promise<IDBDatabase> => {
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
