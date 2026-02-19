import type {
  QuickesUpdatePayload,
  UserPrefsUpdatePayload,
} from '~/types/offline'
import type { QueueFlushContext, QueueItemResult } from '../flushTypes'

export const handleMiscQueueItem = async (
  context: QueueFlushContext,
): Promise<QueueItemResult | null> => {
  switch (context.item.op) {
    case 'quickes_update': {
      const payload = context.item.payload as QuickesUpdatePayload
      await context.api.quickes.update({ quickes: payload.quickes })
      context.stores.quickesStore.setQuickes(payload.quickes)
      return 'processed'
    }

    case 'user_prefs_update': {
      const payload = context.item.payload as UserPrefsUpdatePayload
      await context.api.user.updateState({ preferences: payload.preferences })
      context.stores.settingsStore.applySettingsPatch(payload.preferences)
      context.stores.userStore.applyPreferencesPatch(payload.preferences)
      return 'processed'
    }

    default:
      return null
  }
}
