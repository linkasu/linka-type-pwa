import { computed } from 'vue'
import { useOfflineQueueStore } from '~/stores/offlineQueue'
import { isOffline } from '~/utils/offline'

/**
 * Composable for tracking sync status of items
 */
export const useSyncStatus = () => {
  const offlineQueueStore = useOfflineQueueStore()

  /**
   * Check if an ID is a temporary (pending sync) ID
   * Temporary IDs are prefixed with 'cat_' for categories and 'stmt_' for statements
   */
  const isPendingSync = (id: string): boolean => {
    return id.startsWith('cat_') || id.startsWith('stmt_')
  }

  /**
   * Check if the app is currently offline
   */
  const offline = computed(() => isOffline())

  /**
   * Check if there are pending items to sync
   */
  const hasPendingItems = computed(() => offlineQueueStore.pendingCount > 0)

  /**
   * Get the count of pending items
   */
  const pendingCount = computed(() => offlineQueueStore.pendingCount)

  /**
   * Check if sync is in progress
   */
  const isSyncing = computed(() => offlineQueueStore.isFlushing)

  /**
   * Get the last sync error if any
   */
  const syncError = computed(() => offlineQueueStore.lastError)

  /**
   * Trigger a manual sync
   */
  const syncNow = async () => {
    if (!isOffline()) {
      await offlineQueueStore.flush()
    }
  }

  return {
    isPendingSync,
    offline,
    hasPendingItems,
    pendingCount,
    isSyncing,
    syncError,
    syncNow,
  }
}
