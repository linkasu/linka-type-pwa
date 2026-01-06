import { useUserStore } from '~/stores/user'

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

  // Redirect to setup if not initialized
  if (userStore.needsSetup) {
    return navigateTo('/setup')
  }
})

