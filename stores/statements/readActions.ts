import type { Statement } from '~/types/api'
import { isOffline, shouldQueueOffline } from '~/utils/offline'
import {
  clearStatementsByCategory,
  getQueueItems,
  getStatementsByCategory as getCachedStatementsByCategory,
  remapStatementsCategoryId,
  replaceStatementId as replaceStatementIdCache,
  replaceStatementsForCategory,
} from '~/utils/offlineDb'
import {
  getStatementsByCategory,
  remapCategoryIdInState,
  replaceStatementIdInState,
  setCategoryStatementsInState,
} from './state'
import { applyPendingStatementQueue } from './queue'
import { resolveStatementsUserId, type StatementsStoreContext } from './context'

export const applyPendingStatementsForCategory = async (
  store: StatementsStoreContext,
  userId: string,
  categoryId: string,
) => {
  if (!import.meta.client) return
  const items = await getQueueItems(userId)
  applyPendingStatementQueue(store, items, categoryId)
}

export const fetchStatementsByCategory = async (
  store: StatementsStoreContext,
  categoryId: string,
  force = false,
): Promise<Statement[]> => {
  if (!force && store.loadedCategories.has(categoryId)) {
    return getStatementsByCategory(store, categoryId)
  }

  store.isLoading = true
  store.error = null
  const userId = resolveStatementsUserId()

  let cached: Statement[] = []
  if (import.meta.client && userId) {
    cached = await getCachedStatementsByCategory(userId, categoryId)
    if (cached.length > 0) {
      setCategoryStatementsInState(store, categoryId, cached)
    }
  }

  if (isOffline()) {
    store.loadedCategories.add(categoryId)
    store.isLoading = false
    return getStatementsByCategory(store, categoryId)
  }

  try {
    const { api } = useAppServices()
    const statements = await api.statements.getByCategory(categoryId)
    setCategoryStatementsInState(store, categoryId, statements)
    store.loadedCategories.add(categoryId)

    if (import.meta.client && userId) {
      await applyPendingStatementsForCategory(store, userId, categoryId)
      await replaceStatementsForCategory(userId, categoryId, getStatementsByCategory(store, categoryId))
    }

    return getStatementsByCategory(store, categoryId)
  } catch (err: unknown) {
    if (!shouldQueueOffline(err)) {
      const error = err as Error
      store.error = error.message || 'Failed to fetch statements'
      throw error
    }
    return getStatementsByCategory(store, categoryId)
  } finally {
    store.isLoading = false
  }
}

export const replaceStatementIdAction = async (
  store: StatementsStoreContext,
  tempId: string,
  statement: Statement,
) => {
  replaceStatementIdInState(store, tempId, statement)
  const userId = resolveStatementsUserId()
  if (import.meta.client && userId) {
    await replaceStatementIdCache(userId, tempId, statement)
  }
}

export const remapCategoryIdAction = async (
  store: StatementsStoreContext,
  fromCategoryId: string,
  toCategoryId: string,
) => {
  remapCategoryIdInState(store, fromCategoryId, toCategoryId)
  const userId = resolveStatementsUserId()
  if (import.meta.client && userId) {
    await remapStatementsCategoryId(userId, fromCategoryId, toCategoryId)
  }
}

export const removeStatementsByCategoryAction = async (
  store: StatementsStoreContext,
  categoryId: string,
) => {
  const ids = store.byCategoryId.get(categoryId)
  if (!ids) return

  for (const id of ids) {
    store.statements.delete(id)
  }

  store.byCategoryId.delete(categoryId)
  store.loadedCategories.delete(categoryId)

  const userId = resolveStatementsUserId()
  if (import.meta.client && userId) {
    await clearStatementsByCategory(userId, categoryId)
  }
}

export const getRandomStatementFromCategory = (
  store: StatementsStoreContext,
  categoryId: string,
): Statement | null => {
  const statements = getStatementsByCategory(store, categoryId)
  if (statements.length === 0) return null
  const randomIndex = Math.floor(Math.random() * statements.length)
  return statements[randomIndex]
}
