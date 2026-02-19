import type { UserPreferences } from '~/types/api'
import type { OfflineQueueItem } from '~/types/offline'
import { addQueueItem } from '~/utils/offlineDb'
import { isOffline, shouldQueueOffline } from '~/utils/offline'

const SYNC_DEBOUNCE_MS = 800

let pendingSync: ReturnType<typeof setTimeout> | null = null
let pendingPatch: Partial<UserPreferences> = {}

type AuthStoreLike = {
  user: { id: string } | null
  isAuthenticated: boolean
}

type UserStoreLike = {
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>
  applyPreferencesPatch: (preferences: Partial<UserPreferences>) => void
}

const queueOfflinePatch = async (
  userId: string,
  patch: Partial<UserPreferences>,
  userStore: UserStoreLike,
) => {
  await addQueueItem({
    userId,
    op: 'user_prefs_update',
    payload: { preferences: patch },
    createdAt: Date.now(),
  } satisfies OfflineQueueItem)
  userStore.applyPreferencesPatch(patch)
}

export const schedulePreferenceSync = (
  preferences: Partial<UserPreferences>,
  authStore: AuthStoreLike,
  userStore: UserStoreLike,
) => {
  if (!import.meta.client) return
  if (Object.keys(preferences).length === 0) return

  pendingPatch = { ...pendingPatch, ...preferences }
  if (pendingSync) return

  pendingSync = setTimeout(async () => {
    const patch = { ...pendingPatch }
    pendingPatch = {}
    pendingSync = null

    try {
      if (!authStore.user?.id) return
      if (!authStore.isAuthenticated && !isOffline()) return

      if (isOffline()) {
        await queueOfflinePatch(authStore.user.id, patch, userStore)
        return
      }

      await userStore.updatePreferences(patch)
    } catch (err) {
      if (shouldQueueOffline(err) && authStore.user?.id) {
        await queueOfflinePatch(authStore.user.id, patch, userStore)
        return
      }
      console.warn('Failed to sync preferences:', err)
    }
  }, SYNC_DEBOUNCE_MS)
}
