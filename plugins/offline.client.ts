import { useAuthStore } from '~/stores/auth'
import { useOfflineQueueStore } from '~/stores/offlineQueue'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  authStore.loadFromStorage()

  const offlineQueue = useOfflineQueueStore()
  await offlineQueue.hydrate()

  if (navigator.onLine) {
    void offlineQueue.flush()
  }

  window.addEventListener('online', () => {
    void offlineQueue.flush()
  })
})
