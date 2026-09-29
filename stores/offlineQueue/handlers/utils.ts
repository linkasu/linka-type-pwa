import { applyIdMappingToItem } from '../idMapping'
import { updateQueueItem } from '~/utils/offlineDb'
import type { OfflineQueueItem } from '~/types/offline'
import type { SyncConflict } from '~/types/offline'

export const addConflictOnce = (conflicts: SyncConflict[], conflict: SyncConflict): void => {
  if (conflict.localChange.id === undefined || !conflicts.some(item => item.localChange.id === conflict.localChange.id)) {
    conflicts.push(conflict)
  }
}

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
