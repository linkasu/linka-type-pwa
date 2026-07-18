import type { AnalyticsEventName, AnalyticsEventParams } from '~/types/analytics'

type TrackEvent = <T extends AnalyticsEventName>(
  eventName: T,
  params: AnalyticsEventParams[T],
) => void

const getLengthBucket = (length: number): AnalyticsEventParams['say']['length_bucket'] => {
  if (length <= 0) return 'empty'
  if (length <= 40) return 'short'
  if (length <= 160) return 'medium'
  return 'long'
}

export const createAnalyticsTrackers = (trackEvent: TrackEvent) => ({
  trackPredicatorUse: (position: number) => {
    trackEvent('predicator_use', { position })
  },

  trackSpotlight: (action: 'open' | 'close') => {
    trackEvent('spotlight', { action })
  },

  trackSay: (textLength: number, download = false) => {
    trackEvent('say', {
      length_bucket: getLengthBucket(textLength),
      delivery: download ? 'download' : 'playback',
    })
  },

  trackQuickesSay: (position: number) => {
    trackEvent('quickes_say', { position })
  },

  trackBankCategorySelect: () => {
    trackEvent('bank_cselect', {})
  },

  trackBankStatementSelect: (isPaste: boolean) => {
    trackEvent('bank_sselect', { is_paste: isPaste })
  },

  trackLogin: () => {
    trackEvent('login', {})
  },

  trackLogout: () => {
    trackEvent('logout', {})
  },

  trackRegister: () => {
    trackEvent('register', {})
  },

  trackUpdatePromptShown: () => {
    trackEvent('update_prompt_shown', {})
  },

  trackUpdateAccepted: () => {
    trackEvent('update_accepted', {})
  },

  trackMobileAppPrompt: (platform: 'ios' | 'android') => {
    trackEvent('mobile_app_prompt_shown', { platform })
  },

  trackMobileAppLinkClicked: (platform: 'ios' | 'android') => {
    trackEvent('mobile_app_link_clicked', { platform })
  },

  trackCategoryCacheStarted: (itemCount: number) => {
    trackEvent('bank_cache_started', { item_count: itemCount })
  },

  trackCategoryCacheCompleted: (itemCount: number) => {
    trackEvent('bank_cache_completed', { item_count: itemCount })
  },
})
