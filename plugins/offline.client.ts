import { useAuthStore } from '~/stores/auth'
import { useOfflineQueueStore } from '~/stores/offlineQueue'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  authStore.loadFromStorage()

  const offlineQueue = useOfflineQueueStore()
  await offlineQueue.hydrate()

  if (navigator.onLine && authStore.mode === 'online') {
    offlineQueue.flush().catch((err) => {
      console.error('Failed to flush offline queue:', err)
    })
  }

  window.addEventListener('online', () => {
    if (authStore.mode !== 'online') return
    offlineQueue.flush().catch((err) => {
      console.error('Failed to flush offline queue on reconnect:', err)
    })
  })
})
