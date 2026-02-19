import type { Category } from '~/types/api'
import { isOffline, shouldQueueOffline } from '~/utils/offline'
import {
  getCategories as getCachedCategories,
  getQueueItems,
  replaceCategories,
  replaceCategoryId as replaceCategoryIdCache,
} from '~/utils/offlineDb'
import {
  replaceCategoryIdInState,
  setCategoriesFromList,
} from './state'
import { applyPendingCategoryQueue } from './queue'
import {
  CATEGORIES_CACHE_TTL_MS,
  resolveCategoriesUserId,
  type CategoriesStoreContext,
} from './context'

export const isCategoriesCacheValid = (store: CategoriesStoreContext) => {
  if (!store.lastFetchTime) return false
  return Date.now() - store.lastFetchTime < CATEGORIES_CACHE_TTL_MS
}

export const applyPendingCategories = async (
  store: CategoriesStoreContext,
  userId: string,
) => {
  if (!import.meta.client) return
  const items = await getQueueItems(userId)
  applyPendingCategoryQueue(store, items)
}

export const fetchCategoriesAction = async (
  store: CategoriesStoreContext,
  force = false,
) => {
  if (!force && isCategoriesCacheValid(store)) return

  store.isLoading = true
  store.error = null
  const userId = resolveCategoriesUserId()

  let cached: Category[] = []
  if (import.meta.client && userId) {
    cached = await getCachedCategories(userId)
    if (cached.length > 0) {
      setCategoriesFromList(store, cached)
    }
  }

  if (isOffline()) {
    store.isLoading = false
    return
  }

  try {
    const { api } = useAppServices()
    const categories = await api.categories.getAll()
    setCategoriesFromList(store, categories)
    store.lastFetchTime = Date.now()

    if (import.meta.client && userId) {
      await applyPendingCategories(store, userId)
      await replaceCategories(userId, Array.from(store.categories.values()))
    }
  } catch (err: unknown) {
    if (!shouldQueueOffline(err)) {
      const error = err as Error
      store.error = error.message || 'Failed to fetch categories'
      throw error
    }
  } finally {
    store.isLoading = false
  }
}

export const replaceCategoryIdAction = async (
  store: CategoriesStoreContext,
  tempId: string,
  category: Category,
) => {
  replaceCategoryIdInState(store, tempId, category)
  const userId = resolveCategoriesUserId()
  if (import.meta.client && userId) {
    await replaceCategoryIdCache(userId, tempId, category)
  }
}
