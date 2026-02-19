import type { Category, Statement, UserPreferences } from '~/types/api'

export const DB_NAME = 'linka-offline'
export const DB_VERSION = 2

export const STORES = {
  categories: 'categories',
  statements: 'statements',
  quickes: 'quickes',
  queue: 'queue',
  userState: 'userState',
}

export interface CachedCategory extends Category {
  key: string
  userId: string
}

export interface CachedStatement extends Statement {
  key: string
  userId: string
}

export interface CachedQuickes {
  userId: string
  quickes: string[]
}

export interface CachedUserState {
  userId: string
  inited: boolean
  preferences: UserPreferences
  updatedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

export const isIdbAvailable = (): boolean => typeof indexedDB !== 'undefined'

export const getKey = (userId: string, id: string): string => `${userId}:${id}`

export const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const transactionDone = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
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

      if (!db.objectStoreNames.contains(STORES.categories)) {
        const store = db.createObjectStore(STORES.categories, { keyPath: 'key' })
        store.createIndex('byUserId', 'userId', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.statements)) {
        const store = db.createObjectStore(STORES.statements, { keyPath: 'key' })
        store.createIndex('byUserId', 'userId', { unique: false })
        store.createIndex('byUserCategory', ['userId', 'categoryId'], { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.quickes)) {
        db.createObjectStore(STORES.quickes, { keyPath: 'userId' })
      }

      if (!db.objectStoreNames.contains(STORES.queue)) {
        const store = db.createObjectStore(STORES.queue, {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('byUserId', 'userId', { unique: false })
      }

      if (!db.objectStoreNames.contains(STORES.userState)) {
        db.createObjectStore(STORES.userState, { keyPath: 'userId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

export const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => Promise<T>,
): Promise<T> => {
  const db = await openDb()
  const tx = db.transaction(storeName, mode)
  const store = tx.objectStore(storeName)
  const result = await runner(store)
  await transactionDone(tx)
  return result
}

export const getAllFromIndex = async <T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange,
): Promise<T[]> => {
  return withStore(storeName, 'readonly', async (store) => {
    const index = store.index(indexName)
    return requestToPromise(index.getAll(query))
  })
}
