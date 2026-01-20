import { useUserStore } from '~/stores/user'
import { isOffline } from '~/utils/offline'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()

  // Fetch user state if not loaded
  if (userStore.inited === null) {
    try {
      await userStore.fetchState()
    } catch {
      // If fetch fails, continue to app
      return
    }
  }

  // Don't redirect to setup if offline — user can continue with cached data
  if (import.meta.client && isOffline()) {
    return
  }

  // Redirect to setup if not initialized
  if (userStore.needsSetup) {
    return navigateTo('/setup')
  }
})


