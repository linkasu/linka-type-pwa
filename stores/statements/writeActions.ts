import type { Statement, StatementReplaceResult } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'
import { generateTempId, isOffline, shouldQueueOffline } from '~/utils/offline'
import {
  addQueueItem,
  deleteStatement as deleteStatementCache,
  upsertStatement,
  replaceStatementsForCategory,
} from '~/utils/offlineDb'
import {
  addStatementToState,
  getStatementsByCategory,
  removeStatementFromState,
  setCategoryStatementsInState,
} from './state'
import { resolveStatementsUserId, type StatementsStoreContext } from './context'
import { normalizeStatementText, summarizeStatementReplace } from '~/utils/statementText'

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

const sameStatementTexts = (current: Statement[], texts: string[]) =>
  current.length === texts.length && current.every((statement, index) => statement.text === texts[index])

const createReplacementDrafts = (
  categoryId: string,
  texts: string[],
  current: Statement[],
): Statement[] => {
  const existingByText = new Map(current.map(statement => [statement.text, statement]))
  const now = Date.now()
  return texts.map((text, index) => ({
    id: existingByText.get(text)?.id ?? generateTempId('stmt'),
    categoryId,
    text,
    created: now + index,
  }))
}

const applyOfflineReplacement = async (
  store: StatementsStoreContext,
  userId: string,
  categoryId: string,
  text: string,
  confirmationToken?: string,
): Promise<StatementReplaceResult> => {
  const current = getStatementsByCategory(store, categoryId)
  const normalized = normalizeStatementText(text)
  const summary = summarizeStatementReplace(current, normalized.texts, normalized.duplicates)

  if (sameStatementTexts(current, normalized.texts)) {
    return { applied: true, summary, statements: current }
  }

  const token = JSON.stringify({
    current: current.map(statement => [statement.id, statement.text]),
    result: normalized.texts,
  })
  if (summary.removed > 0 && confirmationToken !== token) {
    return { applied: false, summary, confirmationToken: token }
  }

  const drafts = createReplacementDrafts(categoryId, normalized.texts, current)
  setCategoryStatementsInState(store, categoryId, drafts)
  await replaceStatementsForCategory(userId, categoryId, drafts)
  await addQueueItem({
    userId,
    op: 'statement_replace',
    payload: { categoryId, text, drafts },
    createdAt: Date.now(),
  } satisfies OfflineQueueItem)
  return { applied: true, summary, statements: drafts }
}

export const replaceStatementsAction = async (
  store: StatementsStoreContext,
  categoryId: string,
  text: string,
  confirmationToken?: string,
): Promise<StatementReplaceResult> => {
  store.error = null
  const userId = resolveStatementsUserId()

  if (isOffline()) {
    if (!userId) throw new Error('Missing user for offline statement replacement')
    return applyOfflineReplacement(store, userId, categoryId, text, confirmationToken)
  }

  try {
    const { api } = useAppServices()
    const result = await api.statements.replaceCategory(categoryId, { text, confirmationToken })
    if (result.applied && result.statements) {
      setCategoryStatementsInState(store, categoryId, result.statements)
      if (import.meta.client && userId) {
        await replaceStatementsForCategory(userId, categoryId, result.statements)
      }
    }
    return result
  } catch (err: unknown) {
    if (shouldQueueOffline(err) && userId) {
      return applyOfflineReplacement(store, userId, categoryId, text, confirmationToken)
    }
    const error = err as Error
    store.error = error.message || 'Failed to replace statements'
    throw error
  }
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
