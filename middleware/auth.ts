import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  if (!import.meta.client) {
    return
  }
  
  const authStore = useAuthStore()
  
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  if (!authStore.isAuthenticated) {
    if (import.meta.client && navigator.onLine === false && authStore.hasOfflineSession) {
      return
    }
    return navigateTo('/login')
  }
})
