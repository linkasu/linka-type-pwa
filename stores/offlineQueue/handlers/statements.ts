import { generateTempId } from '~/utils/offline'
import type { Statement } from '~/types/api'
import type { QueueFlushContext, QueueItemResult } from '../flushTypes'
import { addConflictOnce, remapFutureQueueItems } from './utils'

export const mapReplacementDraftIds = (
  drafts: Statement[],
  statements: Statement[],
): Array<[string, string]> => {
  const serverByText = new Map<string, Statement[]>()
  for (const statement of statements) {
    const matches = serverByText.get(statement.text) ?? []
    matches.push(statement)
    serverByText.set(statement.text, matches)
  }
  return drafts.flatMap((draft) => {
    const serverStatement = serverByText.get(draft.text)?.shift()
    return serverStatement && draft.id !== serverStatement.id ? [[draft.id, serverStatement.id]] : []
  })
}

export const handleStatementQueueItem = async (
  context: QueueFlushContext,
): Promise<QueueItemResult | null> => {
  switch (context.item.op) {
    case 'statement_create': {
      const payload = context.item.payload
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
      const payload = context.item.payload
      const resolvedId = context.idMap.get(payload.id) ?? payload.id

      if (payload.originalText !== undefined) {
        try {
          const current = await context.api.statements.getById(resolvedId)
          if (current.text !== payload.originalText) {
            addConflictOnce(context.conflicts, {
              id: generateTempId('conflict'),
              entityType: 'statement',
              entityId: resolvedId,
              conflictType: 'update_update',
              localChange: context.item,
              remoteData: current,
              localData: { ...current, text: payload.text },
              createdAt: Date.now(),
            })
            return 'deferred'
          }
        } catch (fetchErr: unknown) {
          const fetchError = fetchErr as { response?: { status?: number } }
          if (fetchError.response?.status === 404) {
            addConflictOnce(context.conflicts, {
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
      const payload = context.item.payload
      const resolvedId = context.idMap.get(payload.id) ?? payload.id
      await context.api.statements.delete(resolvedId)
      context.stores.statementsStore.removeStatement(resolvedId)
      return 'processed'
    }

    case 'statement_replace': {
      const payload = context.item.payload
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

      const draftIds = new Set(payload.drafts.map(statement => statement.id))
      for (const [draftId, serverId] of mapReplacementDraftIds(payload.drafts, result.statements)) {
        draftIds.add(serverId)
        context.idMap.set(draftId, serverId)
        await remapFutureQueueItems(context.items, context.index, draftId, serverId)
      }
      const hasPendingLocalChanges = context.items.slice(context.index + 1).some((item) => {
        if (item.op === 'statement_replace') {
          const next = item.payload
          return (context.idMap.get(next.categoryId) ?? next.categoryId) === resolvedCategoryId
        }
        if (item.op === 'statement_create') {
          const next = item.payload
          return (context.idMap.get(next.statement.categoryId) ?? next.statement.categoryId) === resolvedCategoryId
        }
        if (item.op === 'statement_update') {
          return draftIds.has(item.payload.id)
        }
        if (item.op === 'statement_delete') {
          return draftIds.has(item.payload.id)
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
