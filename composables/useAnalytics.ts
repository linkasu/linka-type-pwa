import {
  logEvent,
  setUserProperties,
  setUserId,
  setAnalyticsCollectionEnabled,
} from 'firebase/analytics'
import type {
  AnalyticsEventName,
  AnalyticsEventParams,
  AnalyticsUserProperties,
} from '~/types/analytics'

export const useAnalytics = () => {
  const { $analytics } = useNuxtApp()

  // Check if analytics is available
  const isEnabled = computed(() => !!$analytics)

  // Track generic event with type safety
  const trackEvent = <T extends AnalyticsEventName>(
    eventName: T,
    params?: AnalyticsEventParams[T]
  ) => {
    if (!$analytics) {
      if (import.meta.dev) {
        console.log('[Analytics Debug]', eventName, params)
      }
      return
    }

    try {
      // Cast to string for Firebase's logEvent which accepts custom event names
      logEvent($analytics, eventName as string, params as Record<string, unknown>)
      if (import.meta.dev) {
        console.log('[Analytics]', eventName, params)
      }
    } catch (error) {
      console.error('Analytics event error:', error)
    }
  }

  // Specific event trackers
  const trackPredicatorUse = (word: string, position: number) => {
    trackEvent('predicator_use', { word, position })
  }

  const trackSpotlight = (action: 'open' | 'close') => {
    trackEvent('spotlight', { action })
  }

  const trackSay = (textLength: number, download = false) => {
    trackEvent('say', {
      text_length: textLength,
      has_text: textLength > 0,
      download,
    })
  }

  const trackQuickesSay = (phrase: string, index: number) => {
    trackEvent('quickes_say', { phrase, index })
  }

  const trackBankCategorySelect = (categoryId: string, key?: string) => {
    trackEvent('bank_cselect', { category_id: categoryId, key })
  }

  const trackBankStatementSelect = (
    statementId: string,
    isPaste: boolean,
    key?: string
  ) => {
    trackEvent('bank_sselect', {
      statement_id: statementId,
      key,
      is_paste: isPaste,
    })
  }

  const trackLogin = () => {
    trackEvent('login', { method: 'email' })
  }

  const trackLogout = () => {
    trackEvent('logout', {})
  }

  const trackRegister = () => {
    trackEvent('register', { method: 'email' })
  }

  const trackUpdatePromptShown = () => {
    trackEvent('update_prompt_shown', {})
  }

  const trackUpdateAccepted = () => {
    trackEvent('update_accepted', {})
  }

  const trackMobileAppPrompt = (platform: 'ios' | 'android') => {
    trackEvent('mobile_app_prompt_shown', { platform })
  }

  const trackMobileAppLinkClicked = (platform: 'ios' | 'android') => {
    trackEvent('mobile_app_link_clicked', { platform })
  }

  const trackPwaInstallPrompt = () => {
    trackEvent('pwa_install_prompt', {})
  }

  const trackPwaInstalled = () => {
    trackEvent('pwa_installed', {})
  }

  const trackCategoryCacheStarted = (categoryId: string, phraseCount: number) => {
    trackEvent('category_cache_started', {
      category_id: categoryId,
      phrase_count: phraseCount,
    })
  }

  const trackCategoryCacheCompleted = (categoryId: string, phraseCount: number) => {
    trackEvent('category_cache_completed', {
      category_id: categoryId,
      phrase_count: phraseCount,
    })
  }

  const trackSettingsChanged = (
    setting: string,
    value: string | boolean | number
  ) => {
    trackEvent('settings_changed', { setting, value })
  }

  const trackReaderModeOpened = (categoryId: string, statementCount: number) => {
    trackEvent('reader_mode_opened', {
      category_id: categoryId,
      statement_count: statementCount,
    })
  }

  const trackTextEditorOpened = (categoryId: string) => {
    trackEvent('text_editor_opened', { category_id: categoryId })
  }

  // Set user ID from auth
  const setAnalyticsUserId = (userId: string | null) => {
    if (!$analytics) return
    setUserId($analytics, userId)
  }

  // Update user properties
  const updateUserProperties = (properties: Partial<AnalyticsUserProperties>) => {
    if (!$analytics) return
    setUserProperties($analytics, properties as Record<string, unknown>)
  }

  // Consent management
  const setConsent = (granted: boolean) => {
    if (!$analytics) return
    setAnalyticsCollectionEnabled($analytics, granted)
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
    trackPredicatorUse,
    trackSpotlight,
    trackSay,
    trackQuickesSay,
    trackBankCategorySelect,
    trackBankStatementSelect,
    trackLogin,
    trackLogout,
    trackRegister,
    trackUpdatePromptShown,
    trackUpdateAccepted,
    trackMobileAppPrompt,
    trackMobileAppLinkClicked,
    trackPwaInstallPrompt,
    trackPwaInstalled,
    trackCategoryCacheStarted,
    trackCategoryCacheCompleted,
    trackSettingsChanged,
    trackReaderModeOpened,
    trackTextEditorOpened,
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
