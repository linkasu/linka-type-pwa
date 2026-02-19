import type { Statement } from '~/types/api'
import {
  CachedStatement,
  STORES,
  getAllFromIndex,
  getKey,
  isIdbAvailable,
  withStore,
} from './core'

export const getStatementsByCategory = async (
  userId: string,
  categoryId: string,
): Promise<Statement[]> => {
  if (!isIdbAvailable()) return []
  const records = await getAllFromIndex<CachedStatement>(
    STORES.statements,
    'byUserCategory',
    IDBKeyRange.only([userId, categoryId]),
  )
  return records.map(({ key: _key, userId: _userId, ...statement }) => statement)
}

export const upsertStatement = async (userId: string, statement: Statement): Promise<void> => {
  if (!isIdbAvailable()) return
  const record: CachedStatement = {
    ...statement,
    key: getKey(userId, statement.id),
    userId,
  }
  await withStore(STORES.statements, 'readwrite', async (store) => {
    store.put(record)
    return Promise.resolve()
  })
}

export const upsertStatements = async (userId: string, statements: Statement[]): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.statements, 'readwrite', async (store) => {
    for (const statement of statements) {
      store.put({
        ...statement,
        key: getKey(userId, statement.id),
        userId,
      } satisfies CachedStatement)
    }
    return Promise.resolve()
  })
}

export const deleteStatement = async (userId: string, statementId: string): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.statements, 'readwrite', async (store) => {
    store.delete(getKey(userId, statementId))
    return Promise.resolve()
  })
}

export const clearStatementsByCategory = async (
  userId: string,
  categoryId: string,
): Promise<void> => {
  if (!isIdbAvailable()) return
  const records = await getAllFromIndex<CachedStatement>(
    STORES.statements,
    'byUserCategory',
    IDBKeyRange.only([userId, categoryId]),
  )
  await withStore(STORES.statements, 'readwrite', async (store) => {
    for (const record of records) {
      store.delete(record.key)
    }
    return Promise.resolve()
  })
}

export const replaceStatementsForCategory = async (
  userId: string,
  categoryId: string,
  statements: Statement[],
): Promise<void> => {
  if (!isIdbAvailable()) return
  await clearStatementsByCategory(userId, categoryId)
  await upsertStatements(userId, statements)
}

export const replaceStatementId = async (
  userId: string,
  tempId: string,
  statement: Statement,
): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.statements, 'readwrite', async (store) => {
    store.delete(getKey(userId, tempId))
    store.put({
      ...statement,
      key: getKey(userId, statement.id),
      userId,
    } satisfies CachedStatement)
    return Promise.resolve()
  })
}

export const remapStatementsCategoryId = async (
  userId: string,
  fromCategoryId: string,
  toCategoryId: string,
): Promise<void> => {
  if (!isIdbAvailable()) return
  const records = await getAllFromIndex<CachedStatement>(
    STORES.statements,
    'byUserCategory',
    IDBKeyRange.only([userId, fromCategoryId]),
  )
  await withStore(STORES.statements, 'readwrite', async (store) => {
    for (const record of records) {
      store.put({
        ...record,
        categoryId: toCategoryId,
      } satisfies CachedStatement)
    }
    return Promise.resolve()
  })
}
