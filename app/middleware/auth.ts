import { useAuthStore } from '../stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  
  if (!authStore.token) {
    authStore.loadFromStorage()
  }

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
