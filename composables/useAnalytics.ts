import type {
  AnalyticsEventName,
  AnalyticsEventParams,
  AnalyticsUserProperties,
} from '~/types/analytics'
import {
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperties,
} from 'firebase/analytics'
import { createAnalyticsTrackers } from './analytics/trackers'

export const useAnalytics = () => {
  const { analytics } = useAppServices()

  // Check if analytics is available
  const isEnabled = computed(() => !!analytics)

  // Track generic event with type safety
  const trackEvent = <T extends AnalyticsEventName>(
    eventName: T,
    params?: AnalyticsEventParams[T],
  ) => {
    if (!analytics) {
      if (import.meta.dev) {
        console.log('[Analytics Debug]', eventName, params)
      }
      return
    }

    try {
      // Cast to string for Firebase's logEvent which accepts custom event names
      logEvent(analytics, eventName as string, params as Record<string, unknown>)
      if (import.meta.dev) {
        console.log('[Analytics]', eventName, params)
      }
    } catch (error) {
      console.error('Analytics event error:', error)
    }
  }

  const trackers = createAnalyticsTrackers(trackEvent)

  // Set user ID from auth
  const setAnalyticsUserId = (userId: string | null) => {
    if (!analytics) return
    setUserId(analytics, userId)
  }

  // Update user properties
  const updateUserProperties = (properties: Partial<AnalyticsUserProperties>) => {
    if (!analytics) return
    setUserProperties(analytics, properties as Record<string, unknown>)
  }

  // Consent management
  const setConsent = (granted: boolean) => {
    if (!analytics) return
    setAnalyticsCollectionEnabled(analytics, granted)
    localStorage.setItem('analytics_consent', granted ? 'granted' : 'denied')
  }

  const getConsent = (): 'granted' | 'denied' | 'unknown' => {
    const consent = localStorage.getItem('analytics_consent')
    if (consent === 'granted') return 'granted'
    if (consent === 'denied') return 'denied'
    return 'unknown'
  }

  // Helper functions
  const isPwa = () => {
    if (typeof window === 'undefined') return false
    const nav = navigator as Navigator & { standalone?: boolean }
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      nav.standalone === true
    )
  }

  const detectPlatform = (): 'web' | 'ios' | 'android' => {
    if (typeof navigator === 'undefined') return 'web'
    if (/iPad|iPhone|iPod/i.test(navigator.userAgent)) return 'ios'
    if (/Android/i.test(navigator.userAgent)) return 'android'
    return 'web'
  }

  return {
    isEnabled,
    trackEvent,
    // Specific trackers
    ...trackers,
    // User management
    setAnalyticsUserId,
    updateUserProperties,
    // Consent
    setConsent,
    getConsent,
    // Helpers
    isPwa,
    detectPlatform,
  }
}
