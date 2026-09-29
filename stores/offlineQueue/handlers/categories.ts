import { generateTempId } from '~/utils/offline'
import type { Category } from '~/types/api'
import type { QueueFlushContext, QueueItemResult } from '../flushTypes'
import { addConflictOnce, remapFutureQueueItems } from './utils'

export const handleCategoryQueueItem = async (
  context: QueueFlushContext,
): Promise<QueueItemResult | null> => {
  switch (context.item.op) {
    case 'category_create': {
      const payload = context.item.payload
      const created = await context.api.categories.create({
        label: payload.category.label,
        created: payload.category.created,
        aiUse: payload.category.aiUse,
      })

      await context.stores.categoriesStore.replaceCategoryId(payload.category.id, created)
      await context.stores.statementsStore.remapCategoryId(payload.category.id, created.id)
      context.idMap.set(payload.category.id, created.id)
      await remapFutureQueueItems(context.items, context.index, payload.category.id, created.id)
      return 'processed'
    }

    case 'category_update': {
      const payload = context.item.payload
      const resolvedId = context.idMap.get(payload.id) ?? payload.id

      if (payload.originalLabel !== undefined) {
        try {
          const current = await context.api.categories.getById(resolvedId)
          if (current.label !== payload.originalLabel || current.aiUse !== payload.originalAiUse) {
            addConflictOnce(context.conflicts, {
              id: generateTempId('conflict'),
              entityType: 'category',
              entityId: resolvedId,
              conflictType: 'update_update',
              localChange: context.item,
              remoteData: current,
              localData: {
                ...current,
                label: payload.label,
                aiUse: payload.aiUse ?? current.aiUse,
              },
              createdAt: Date.now(),
            })
            return 'deferred'
          }
        } catch (fetchErr: unknown) {
          const fetchError = fetchErr as { response?: { status?: number } }
          if (fetchError.response?.status === 404) {
            addConflictOnce(context.conflicts, {
              id: generateTempId('conflict'),
              entityType: 'category',
              entityId: resolvedId,
              conflictType: 'update_delete',
              localChange: context.item,
              createdAt: Date.now(),
            })
            return 'deferred'
          }
          throw fetchErr
        }
      }

      const updated = await context.api.categories.update(resolvedId, {
        label: payload.label,
        aiUse: payload.aiUse,
      })
      context.stores.categoriesStore.updateCategory(updated)
      return 'processed'
    }

    case 'category_delete': {
      const payload = context.item.payload
      const resolvedId = context.idMap.get(payload.id) ?? payload.id
      await context.api.categories.delete(resolvedId)
      context.stores.categoriesStore.removeCategory(resolvedId)
      await context.stores.statementsStore.removeStatementsByCategory(resolvedId)
      return 'processed'
    }

    default:
      return null
  }
}
