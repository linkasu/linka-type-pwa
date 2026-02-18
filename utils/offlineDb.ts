import type { Category, Statement, UserPreferences } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'

const DB_NAME = 'linka-offline'
const DB_VERSION = 2

const STORES = {
  categories: 'categories',
  statements: 'statements',
  quickes: 'quickes',
  queue: 'queue',
  userState: 'userState',
}

interface CachedCategory extends Category {
  key: string
  userId: string
}

interface CachedStatement extends Statement {
  key: string
  userId: string
}

interface CachedQuickes {
  userId: string
  quickes: string[]
}

interface CachedUserState {
  userId: string
  inited: boolean
  preferences: UserPreferences
  updatedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

const isIdbAvailable = (): boolean => typeof indexedDB !== 'undefined'

const getKey = (userId: string, id: string): string => `${userId}:${id}`

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
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

const withStore = async <T>(
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

const getAllFromIndex = async <T>(
  storeName: string,
  indexName: string,
  query: IDBValidKey | IDBKeyRange,
): Promise<T[]> => {
  return withStore(storeName, 'readonly', async (store) => {
    const index = store.index(indexName)
    return requestToPromise(index.getAll(query))
  })
}

export const getCategories = async (userId: string): Promise<Category[]> => {
  if (!isIdbAvailable()) return []
  const records = await getAllFromIndex<CachedCategory>(
    STORES.categories,
    'byUserId',
    IDBKeyRange.only(userId),
  )
  return records.map(({ key: _key, userId: _userId, ...category }) => ({
    ...category,
    aiUse: category.aiUse ?? false,
  }))
}

export const upsertCategory = async (userId: string, category: Category): Promise<void> => {
  if (!isIdbAvailable()) return
  const record: CachedCategory = {
    ...category,
    key: getKey(userId, category.id),
    userId,
  }
  await withStore(STORES.categories, 'readwrite', async (store) => {
    store.put(record)
    return Promise.resolve()
  })
}

export const upsertCategories = async (userId: string, categories: Category[]): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.categories, 'readwrite', async (store) => {
    for (const category of categories) {
      store.put({
        ...category,
        key: getKey(userId, category.id),
        userId,
      } satisfies CachedCategory)
    }
    return Promise.resolve()
  })
}

export const replaceCategories = async (userId: string, categories: Category[]): Promise<void> => {
  if (!isIdbAvailable()) return
  const existing = await getCategories(userId)
  const keep = new Set(categories.map((category) => category.id))

  await withStore(STORES.categories, 'readwrite', async (store) => {
    for (const category of existing) {
      if (!keep.has(category.id)) {
        store.delete(getKey(userId, category.id))
      }
    }
    for (const category of categories) {
      store.put({
        ...category,
        key: getKey(userId, category.id),
        userId,
      } satisfies CachedCategory)
    }
    return Promise.resolve()
  })
}
export const deleteCategory = async (userId: string, categoryId: string): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.categories, 'readwrite', async (store) => {
    store.delete(getKey(userId, categoryId))
    return Promise.resolve()
  })
}

export const replaceCategoryId = async (
  userId: string,
  tempId: string,
  category: Category,
): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.categories, 'readwrite', async (store) => {
    store.delete(getKey(userId, tempId))
    store.put({
      ...category,
      key: getKey(userId, category.id),
      userId,
    } satisfies CachedCategory)
    return Promise.resolve()
  })
}

export const getStatementsByCategory = async (
  userId: string,
  categoryId: string,
): Promise<Statement[]> => {
  if (!isIdbAvailable()) return []
  const records = await getAllFromIndex<CachedStatement>(
    STORES.statements,
    'byUserCategory',
    IDBKeyRange.only([userId, categoryId]),
  )
  return records.map(({ key: _key, userId: _userId, ...statement }) => statement)
}

export const upsertStatement = async (userId: string, statement: Statement): Promise<void> => {
  if (!isIdbAvailable()) return
  const record: CachedStatement = {
    ...statement,
    key: getKey(userId, statement.id),
    userId,
  }
  await withStore(STORES.statements, 'readwrite', async (store) => {
    store.put(record)
    return Promise.resolve()
  })
}

export const upsertStatements = async (userId: string, statements: Statement[]): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.statements, 'readwrite', async (store) => {
    for (const statement of statements) {
      store.put({
        ...statement,
        key: getKey(userId, statement.id),
        userId,
      } satisfies CachedStatement)
    }
    return Promise.resolve()
  })
}

export const deleteStatement = async (userId: string, statementId: string): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.statements, 'readwrite', async (store) => {
    store.delete(getKey(userId, statementId))
    return Promise.resolve()
  })
}

export const clearStatementsByCategory = async (
  userId: string,
  categoryId: string,
): Promise<void> => {
  if (!isIdbAvailable()) return
  const records = await getAllFromIndex<CachedStatement>(
    STORES.statements,
    'byUserCategory',
    IDBKeyRange.only([userId, categoryId]),
  )
  await withStore(STORES.statements, 'readwrite', async (store) => {
    for (const record of records) {
      store.delete(record.key)
    }
    return Promise.resolve()
  })
}

export const replaceStatementsForCategory = async (
  userId: string,
  categoryId: string,
  statements: Statement[],
): Promise<void> => {
  if (!isIdbAvailable()) return
  await clearStatementsByCategory(userId, categoryId)
  await upsertStatements(userId, statements)
}

export const replaceStatementId = async (
  userId: string,
  tempId: string,
  statement: Statement,
): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.statements, 'readwrite', async (store) => {
    store.delete(getKey(userId, tempId))
    store.put({
      ...statement,
      key: getKey(userId, statement.id),
      userId,
    } satisfies CachedStatement)
    return Promise.resolve()
  })
}

export const remapStatementsCategoryId = async (
  userId: string,
  fromCategoryId: string,
  toCategoryId: string,
): Promise<void> => {
  if (!isIdbAvailable()) return
  const records = await getAllFromIndex<CachedStatement>(
    STORES.statements,
    'byUserCategory',
    IDBKeyRange.only([userId, fromCategoryId]),
  )
  await withStore(STORES.statements, 'readwrite', async (store) => {
    for (const record of records) {
      store.put({
        ...record,
        categoryId: toCategoryId,
      } satisfies CachedStatement)
    }
    return Promise.resolve()
  })
}

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

export const addQueueItem = async (item: OfflineQueueItem): Promise<number | null> => {
  if (!isIdbAvailable()) return null
  return withStore(STORES.queue, 'readwrite', async (store) => {
    return requestToPromise<number>(store.add(item) as IDBRequest<number>)
  })
}

export const updateQueueItem = async (item: OfflineQueueItem): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.queue, 'readwrite', async (store) => {
    store.put(item)
    return Promise.resolve()
  })
}

export const deleteQueueItem = async (id: number): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.queue, 'readwrite', async (store) => {
    store.delete(id)
    return Promise.resolve()
  })
}

export const getQueueItems = async (userId: string): Promise<OfflineQueueItem[]> => {
  if (!isIdbAvailable()) return []
  const items = await getAllFromIndex<OfflineQueueItem>(
    STORES.queue,
    'byUserId',
    IDBKeyRange.only(userId),
  )
  return items.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
}

export const clearQueueForUser = async (userId: string): Promise<void> => {
  if (!isIdbAvailable()) return
  const items = await getQueueItems(userId)
  await withStore(STORES.queue, 'readwrite', async (store) => {
    for (const item of items) {
      if (item.id !== undefined) {
        store.delete(item.id)
      }
    }
    return Promise.resolve()
  })
}

export const clearUserData = async (userId: string): Promise<void> => {
  if (!isIdbAvailable()) return
  const categories = await getCategories(userId)
  const statements = await getAllFromIndex<CachedStatement>(
    STORES.statements,
    'byUserId',
    IDBKeyRange.only(userId),
  )
  await withStore(STORES.categories, 'readwrite', async (store) => {
    for (const category of categories) {
      store.delete(getKey(userId, category.id))
    }
    return Promise.resolve()
  })
  await withStore(STORES.statements, 'readwrite', async (store) => {
    for (const statement of statements) {
      store.delete(statement.key)
    }
    return Promise.resolve()
  })
  await withStore(STORES.quickes, 'readwrite', async (store) => {
    store.delete(userId)
    return Promise.resolve()
  })
  await withStore(STORES.userState, 'readwrite', async (store) => {
    store.delete(userId)
    return Promise.resolve()
  })
  await clearQueueForUser(userId)
}
