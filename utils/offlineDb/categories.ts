import type { Category } from '~/types/api'
import {
  CachedCategory,
  STORES,
  getAllFromIndex,
  getKey,
  isIdbAvailable,
  withStore,
} from './core'

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
