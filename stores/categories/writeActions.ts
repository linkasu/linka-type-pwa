import type { Category } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'
import { generateTempId, isOffline, shouldQueueOffline } from '~/utils/offline'
import {
  addQueueItem,
  deleteCategory as deleteCategoryCache,
  upsertCategory,
} from '~/utils/offlineDb'
import {
  removeCategoryFromState,
  setCategoryInState,
} from './state'
import { resolveCategoriesUserId, type CategoriesStoreContext } from './context'

const createDraftCategory = (label: string, aiUse = false): Category => ({
  id: generateTempId('cat'),
  label,
  created: Date.now(),
  default: false,
  aiUse,
})

const queueCreateCategory = async (userId: string, category: Category) => {
  await upsertCategory(userId, category)
  await addQueueItem({
    userId,
    op: 'category_create',
    payload: { category },
    createdAt: Date.now(),
  } satisfies OfflineQueueItem)
}

const queueUpdateCategory = async (
  userId: string,
  original: Category,
  label: string,
  aiUse?: boolean,
) => {
  const updatedCategory: Category = {
    ...original,
    label,
    aiUse: aiUse ?? original.aiUse ?? false,
  }

  await upsertCategory(userId, updatedCategory)
  await addQueueItem({
    userId,
    op: 'category_update',
    payload: {
      id: original.id,
      label,
      aiUse,
      originalLabel: original.label,
      originalAiUse: original.aiUse,
    },
    createdAt: Date.now(),
  } satisfies OfflineQueueItem)

  return updatedCategory
}

const queueDeleteCategory = async (userId: string, id: string) => {
  await deleteCategoryCache(userId, id)
  await addQueueItem({
    userId,
    op: 'category_delete',
    payload: { id },
    createdAt: Date.now(),
  } satisfies OfflineQueueItem)
}

export const createCategoryAction = async (
  store: CategoriesStoreContext,
  label: string,
  aiUse = false,
): Promise<Category> => {
  store.error = null
  const userId = resolveCategoriesUserId()

  try {
    if (isOffline()) {
      if (!userId) throw new Error('Missing user for offline create')
      const category = createDraftCategory(label, aiUse)
      setCategoryInState(store, category)
      await queueCreateCategory(userId, category)
      return category
    }

    const { api } = useAppServices()
    const category = await api.categories.create({ label, created: Date.now(), aiUse })
    const normalized = setCategoryInState(store, {
      ...category,
      aiUse: category.aiUse ?? aiUse ?? false,
    })

    if (import.meta.client && userId) {
      await upsertCategory(userId, normalized)
    }

    return normalized
  } catch (err: unknown) {
    if (shouldQueueOffline(err) && userId) {
      const category = createDraftCategory(label, aiUse)
      setCategoryInState(store, category)
      await queueCreateCategory(userId, category)
      return category
    }

    const error = err as Error
    store.error = error.message || 'Failed to create category'
    throw error
  }
}

export const updateCategoryLabelAction = async (
  store: CategoriesStoreContext,
  id: string,
  label: string,
  aiUse?: boolean,
): Promise<Category> => {
  const original = store.categories.get(id)
  if (!original) throw new Error('Category not found')

  const optimistic: Category = {
    ...original,
    label,
    aiUse: aiUse ?? original.aiUse ?? false,
  }

  store.categories.set(id, optimistic)
  const userId = resolveCategoriesUserId()

  try {
    if (isOffline()) {
      if (!userId) throw new Error('Missing user for offline update')
      await queueUpdateCategory(userId, original, label, aiUse)
      return optimistic
    }

    const { api } = useAppServices()
    const updated = await api.categories.update(id, { label, aiUse })
    const normalized = setCategoryInState(store, {
      ...updated,
      aiUse: updated.aiUse ?? false,
    })

    if (import.meta.client && userId) {
      await upsertCategory(userId, normalized)
    }

    return normalized
  } catch (err: unknown) {
    if (shouldQueueOffline(err) && userId) {
      await queueUpdateCategory(userId, original, label, aiUse)
      return optimistic
    }

    store.categories.set(id, original)
    const error = err as Error
    store.error = error.message || 'Failed to update category'
    throw error
  }
}

export const deleteCategoryAction = async (
  store: CategoriesStoreContext,
  id: string,
): Promise<void> => {
  const original = store.categories.get(id)
  removeCategoryFromState(store, id)
  const userId = resolveCategoriesUserId()

  try {
    if (isOffline()) {
      if (!userId) throw new Error('Missing user for offline delete')
      await queueDeleteCategory(userId, id)
      return
    }

    const { api } = useAppServices()
    await api.categories.delete(id)
    if (import.meta.client && userId) {
      await deleteCategoryCache(userId, id)
    }
  } catch (err: unknown) {
    if (shouldQueueOffline(err) && userId) {
      await queueDeleteCategory(userId, id)
      return
    }

    if (original) {
      setCategoryInState(store, original)
    }

    const error = err as Error
    store.error = error.message || 'Failed to delete category'
    throw error
  }
}
