import type {
  CategoryCreatePayload,
  CategoryDeletePayload,
  CategoryUpdatePayload,
  OfflineQueueItem,
  StatementCreatePayload,
  StatementDeletePayload,
  StatementUpdatePayload,
} from '~/types/offline'

export const applyIdMappingToItem = (
  item: OfflineQueueItem,
  fromId: string,
  toId: string,
): boolean => {
  let changed = false

  switch (item.op) {
    case 'category_create': {
      const payload = item.payload as CategoryCreatePayload
      if (payload.category.id === fromId) {
        payload.category.id = toId
        changed = true
      }
      break
    }
    case 'category_update': {
      const payload = item.payload as CategoryUpdatePayload
      if (payload.id === fromId) {
        payload.id = toId
        changed = true
      }
      break
    }
    case 'category_delete': {
      const payload = item.payload as CategoryDeletePayload
      if (payload.id === fromId) {
        payload.id = toId
        changed = true
      }
      break
    }
    case 'statement_create': {
      const payload = item.payload as StatementCreatePayload
      if (payload.statement.id === fromId) {
        payload.statement.id = toId
        changed = true
      }
      if (payload.statement.categoryId === fromId) {
        payload.statement.categoryId = toId
        changed = true
      }
      break
    }
    case 'statement_update': {
      const payload = item.payload as StatementUpdatePayload
      if (payload.id === fromId) {
        payload.id = toId
        changed = true
      }
      break
    }
    case 'statement_delete': {
      const payload = item.payload as StatementDeletePayload
      if (payload.id === fromId) {
        payload.id = toId
        changed = true
      }
      if (payload.categoryId === fromId) {
        payload.categoryId = toId
        changed = true
      }
      break
    }
    default:
      break
  }

  return changed
}
