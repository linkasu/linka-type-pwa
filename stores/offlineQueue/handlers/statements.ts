import { generateTempId } from '~/utils/offline'
import type { Statement } from '~/types/api'
import type {
  StatementCreatePayload,
  StatementDeletePayload,
  StatementUpdatePayloadWithOriginal,
} from '~/types/offline'
import type { QueueFlushContext, QueueItemResult } from '../flushTypes'
import { remapFutureQueueItems } from './utils'

export const handleStatementQueueItem = async (
  context: QueueFlushContext,
): Promise<QueueItemResult | null> => {
  switch (context.item.op) {
    case 'statement_create': {
      const payload = context.item.payload as StatementCreatePayload
      const resolvedCategoryId =
        context.idMap.get(payload.statement.categoryId) ?? payload.statement.categoryId

      const created = await context.api.statements.create({
        categoryId: resolvedCategoryId,
        text: payload.statement.text,
        created: payload.statement.created,
      })

      await context.stores.statementsStore.replaceStatementId(payload.statement.id, created)
      context.idMap.set(payload.statement.id, created.id)
      await remapFutureQueueItems(context.items, context.index, payload.statement.id, created.id)
      return 'processed'
    }

    case 'statement_update': {
      const payload = context.item.payload as StatementUpdatePayloadWithOriginal
      const resolvedId = context.idMap.get(payload.id) ?? payload.id

      if (payload.originalText !== undefined) {
        try {
          const current = await context.api.statements.getById(resolvedId)
          if (current.text !== payload.originalText) {
            context.conflicts.push({
              id: generateTempId('conflict'),
              entityType: 'statement',
              entityId: resolvedId,
              conflictType: 'update_update',
              localChange: context.item,
              remoteData: current,
              localData: { ...current, text: payload.text } as Statement,
              createdAt: Date.now(),
            })
            return 'deferred'
          }
        } catch (fetchErr: unknown) {
          const fetchError = fetchErr as { response?: { status?: number } }
          if (fetchError.response?.status === 404) {
            context.conflicts.push({
              id: generateTempId('conflict'),
              entityType: 'statement',
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

      const updated = await context.api.statements.update(resolvedId, { text: payload.text })
      context.stores.statementsStore.updateStatement(updated)
      return 'processed'
    }

    case 'statement_delete': {
      const payload = context.item.payload as StatementDeletePayload
      const resolvedId = context.idMap.get(payload.id) ?? payload.id
      await context.api.statements.delete(resolvedId)
      context.stores.statementsStore.removeStatement(resolvedId)
      return 'processed'
    }

    default:
      return null
  }
}
