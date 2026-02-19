import { applyIdMappingToItem } from '../idMapping'
import { updateQueueItem } from '~/utils/offlineDb'
import type { OfflineQueueItem } from '~/types/offline'

export const remapFutureQueueItems = async (
  items: OfflineQueueItem[],
  startIndex: number,
  fromId: string,
  toId: string,
) => {
  for (let i = startIndex + 1; i < items.length; i += 1) {
    const updated = applyIdMappingToItem(items[i], fromId, toId)
    if (updated) {
      await updateQueueItem(items[i])
    }
  }
}
