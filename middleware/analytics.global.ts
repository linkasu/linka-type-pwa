import { logEvent } from 'firebase/analytics'

export default defineNuxtRouteMiddleware((to, from) => {
  // Only track on client side
  if (!import.meta.client) return

  // Skip if navigating to same page
  if (to.path === from.path) return

  // Use nextTick to ensure analytics is initialized
  nextTick(() => {
    const { $analytics } = useNuxtApp()
    if (!$analytics) return

    logEvent($analytics, 'page_view', {
      page_title: (to.meta.title as string) || to.name?.toString() || to.path,
      page_path: to.path,
      page_location: window.location.href,
    })

    if (import.meta.dev) {
      console.log('[Analytics] page_view', to.path)
    }
  })
})
