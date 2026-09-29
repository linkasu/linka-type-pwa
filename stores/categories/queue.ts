import type { Category } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'
import {
  normalizeCategory,
  removeCategoryFromState,
  setCategoryInState,
  type CategoriesCollection,
} from './state'

export const applyPendingCategoryQueue = (
  state: CategoriesCollection,
  items: OfflineQueueItem[],
) => {
  for (const item of items) {
    switch (item.op) {
      case 'category_create': {
        const payload = item.payload
        if (!state.categories.has(payload.category.id)) {
          setCategoryInState(state, payload.category)
        }
        break
      }
      case 'category_update': {
        const payload = item.payload
        const existing = state.categories.get(payload.id)
        if (existing) {
          setCategoryInState(state, {
            ...existing,
            label: payload.label,
            aiUse: payload.aiUse ?? existing.aiUse ?? false,
          })
        }
        break
      }
      case 'category_delete': {
        const payload = item.payload
        removeCategoryFromState(state, payload.id)
        break
      }
      default:
        break
    }
  }
}
