import type { Statement } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'
import { generateTempId, isOffline, shouldQueueOffline } from '~/utils/offline'
import {
  addQueueItem,
  deleteStatement as deleteStatementCache,
  upsertStatement,
} from '~/utils/offlineDb'
import { addStatementToState, removeStatementFromState } from './state'
import { resolveStatementsUserId, type StatementsStoreContext } from './context'

const createDraftStatement = (categoryId: string, text: string): Statement => ({
  id: generateTempId('stmt'),
  categoryId,
  text,
  created: Date.now(),
})

const queueCreateStatement = async (userId: string, statement: Statement) => {
  await upsertStatement(userId, statement)
  await addQueueItem({
    userId,
    op: 'statement_create',
    payload: { statement },
    createdAt: Date.now(),
  } satisfies OfflineQueueItem)
}

const queueUpdateStatement = async (
  userId: string,
  original: Statement,
  text: string,
) => {
  await upsertStatement(userId, { ...original, text })
  await addQueueItem({
    userId,
    op: 'statement_update',
    payload: { id: original.id, text, originalText: original.text },
    createdAt: Date.now(),
  } satisfies OfflineQueueItem)
}

const queueDeleteStatement = async (userId: string, statement: Statement) => {
  await deleteStatementCache(userId, statement.id)
  await addQueueItem({
    userId,
    op: 'statement_delete',
    payload: { id: statement.id, categoryId: statement.categoryId },
    createdAt: Date.now(),
  } satisfies OfflineQueueItem)
}

export const createStatementAction = async (
  store: StatementsStoreContext,
  categoryId: string,
  text: string,
): Promise<Statement> => {
  store.error = null
  const userId = resolveStatementsUserId()

  try {
    if (isOffline()) {
      if (!userId) throw new Error('Missing user for offline create')
      const statement = createDraftStatement(categoryId, text)
      addStatementToState(store, statement)
      await queueCreateStatement(userId, statement)
      return statement
    }

    const { api } = useAppServices()
    const statement = await api.statements.create({ categoryId, text, created: Date.now() })
    addStatementToState(store, statement)
    if (import.meta.client && userId) {
      await upsertStatement(userId, statement)
    }
    return statement
  } catch (err: unknown) {
    if (shouldQueueOffline(err) && userId) {
      const statement = createDraftStatement(categoryId, text)
      addStatementToState(store, statement)
      await queueCreateStatement(userId, statement)
      return statement
    }

    const error = err as Error
    store.error = error.message || 'Failed to create statement'
    throw error
  }
}

export const updateStatementTextAction = async (
  store: StatementsStoreContext,
  id: string,
  text: string,
): Promise<Statement> => {
  const original = store.statements.get(id)
  if (!original) throw new Error('Statement not found')

  store.statements.set(id, { ...original, text })
  const userId = resolveStatementsUserId()

  try {
    if (isOffline()) {
      if (!userId) throw new Error('Missing user for offline update')
      await queueUpdateStatement(userId, original, text)
      return { ...original, text }
    }

    const { api } = useAppServices()
    const updated = await api.statements.update(id, { text })
    store.statements.set(id, updated)
    if (import.meta.client && userId) {
      await upsertStatement(userId, updated)
    }
    return updated
  } catch (err: unknown) {
    if (shouldQueueOffline(err) && userId) {
      await queueUpdateStatement(userId, original, text)
      return { ...original, text }
    }

    store.statements.set(id, original)
    const error = err as Error
    store.error = error.message || 'Failed to update statement'
    throw error
  }
}

export const deleteStatementAction = async (
  store: StatementsStoreContext,
  id: string,
): Promise<void> => {
  const original = store.statements.get(id)
  if (!original) return

  removeStatementFromState(store, id)
  const userId = resolveStatementsUserId()

  try {
    if (isOffline()) {
      if (!userId) throw new Error('Missing user for offline delete')
      await queueDeleteStatement(userId, original)
      return
    }

    const { api } = useAppServices()
    await api.statements.delete(id)
    if (import.meta.client && userId) {
      await deleteStatementCache(userId, id)
    }
  } catch (err: unknown) {
    if (shouldQueueOffline(err) && userId) {
      await queueDeleteStatement(userId, original)
      return
    }

    addStatementToState(store, original)
    const error = err as Error
    store.error = error.message || 'Failed to delete statement'
    throw error
  }
}
