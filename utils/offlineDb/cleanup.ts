import { STORES, CachedStatement, getAllFromIndex, getKey, isIdbAvailable, withStore } from './core'
import { getCategories } from './categories'
import { clearQueueForUser } from './queue'

export const clearUserData = async (userId: string): Promise<void> => {
  if (!isIdbAvailable()) return
  const categories = await getCategories(userId)
  const statements = await getAllFromIndex<CachedStatement>(
    STORES.statements,
    'byUserId',
    IDBKeyRange.only(userId),
  )
  await withStore(STORES.categories, 'readwrite', async (store) => {
    for (const category of categories) {
      store.delete(getKey(userId, category.id))
    }
    return Promise.resolve()
  })
  await withStore(STORES.statements, 'readwrite', async (store) => {
    for (const statement of statements) {
      store.delete(statement.key)
    }
    return Promise.resolve()
  })
  await withStore(STORES.quickes, 'readwrite', async (store) => {
    store.delete(userId)
    return Promise.resolve()
  })
  await withStore(STORES.userState, 'readwrite', async (store) => {
    store.delete(userId)
    return Promise.resolve()
  })
  await clearQueueForUser(userId)
}
