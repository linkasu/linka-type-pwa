import type { OfflineQueueItem } from '~/types/offline'
import {
  STORES,
  getAllFromIndex,
  isIdbAvailable,
  requestToPromise,
  withStore,
} from './core'

export const addQueueItem = async (item: OfflineQueueItem): Promise<number | null> => {
  if (!isIdbAvailable()) return null
  return withStore(STORES.queue, 'readwrite', async (store) => {
    return requestToPromise<number>(store.add(item) as IDBRequest<number>)
  })
}

export const updateQueueItem = async (item: OfflineQueueItem): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.queue, 'readwrite', async (store) => {
    store.put(item)
    return Promise.resolve()
  })
}

export const deleteQueueItem = async (id: number): Promise<void> => {
  if (!isIdbAvailable()) return
  await withStore(STORES.queue, 'readwrite', async (store) => {
    store.delete(id)
    return Promise.resolve()
  })
}

export const getQueueItems = async (userId: string): Promise<OfflineQueueItem[]> => {
  if (!isIdbAvailable()) return []
  const items = await getAllFromIndex<OfflineQueueItem>(
    STORES.queue,
    'byUserId',
    IDBKeyRange.only(userId),
  )
  return items.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
}

export const clearQueueForUser = async (userId: string): Promise<void> => {
  if (!isIdbAvailable()) return
  const items = await getQueueItems(userId)
  await withStore(STORES.queue, 'readwrite', async (store) => {
    for (const item of items) {
      if (item.id !== undefined) {
        store.delete(item.id)
      }
    }
    return Promise.resolve()
  })
}
