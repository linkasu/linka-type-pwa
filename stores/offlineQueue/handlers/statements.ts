import { generateTempId } from '~/utils/offline'
import type { Statement } from '~/types/api'
import type {
  StatementCreatePayload,
  StatementDeletePayload,
  StatementReplacePayload,
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

    case 'statement_replace': {
      const payload = context.item.payload as StatementReplacePayload
      const resolvedCategoryId = context.idMap.get(payload.categoryId) ?? payload.categoryId
      let result = await context.api.statements.replaceCategory(resolvedCategoryId, {
        text: payload.text,
      })
      if (!result.applied && result.confirmationToken) {
        result = await context.api.statements.replaceCategory(resolvedCategoryId, {
          text: payload.text,
          confirmationToken: result.confirmationToken,
        })
      }
      if (!result.applied || !result.statements) {
        throw new Error('Failed to apply statement replacement')
      }

      const serverByText = new Map(result.statements.map(statement => [statement.text, statement]))
      const draftIds = new Set(payload.drafts.map(statement => statement.id))
      for (const draft of payload.drafts) {
        const serverStatement = serverByText.get(draft.text)
        if (!serverStatement || draft.id === serverStatement.id) continue
        draftIds.add(serverStatement.id)
        context.idMap.set(draft.id, serverStatement.id)
        await remapFutureQueueItems(context.items, context.index, draft.id, serverStatement.id)
      }
      const hasPendingLocalChanges = context.items.slice(context.index + 1).some((item) => {
        if (item.op === 'statement_replace') {
          const next = item.payload as StatementReplacePayload
          return (context.idMap.get(next.categoryId) ?? next.categoryId) === resolvedCategoryId
        }
        if (item.op === 'statement_create') {
          const next = item.payload as StatementCreatePayload
          return (context.idMap.get(next.statement.categoryId) ?? next.statement.categoryId) === resolvedCategoryId
        }
        if (item.op === 'statement_update') {
          return draftIds.has((item.payload as StatementUpdatePayloadWithOriginal).id)
        }
        if (item.op === 'statement_delete') {
          return draftIds.has((item.payload as StatementDeletePayload).id)
        }
        return false
      })
      if (!hasPendingLocalChanges) {
        await context.stores.statementsStore.replaceCategoryStatements(
          resolvedCategoryId,
          result.statements,
        )
      }
      return 'processed'
    }

    default:
      return null
  }
}
