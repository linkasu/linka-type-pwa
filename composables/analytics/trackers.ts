import type { AnalyticsEventName, AnalyticsEventParams } from '~/types/analytics'

type TrackEvent = <T extends AnalyticsEventName>(
  eventName: T,
  params?: AnalyticsEventParams[T],
) => void

export const createAnalyticsTrackers = (trackEvent: TrackEvent) => ({
  trackPredicatorUse: (word: string, position: number) => {
    trackEvent('predicator_use', { word, position })
  },

  trackSpotlight: (action: 'open' | 'close') => {
    trackEvent('spotlight', { action })
  },

  trackSay: (textLength: number, download = false) => {
    trackEvent('say', {
      text_length: textLength,
      has_text: textLength > 0,
      download,
    })
  },

  trackQuickesSay: (phrase: string, index: number) => {
    trackEvent('quickes_say', { phrase, index })
  },

  trackBankCategorySelect: (categoryId: string, key?: string) => {
    trackEvent('bank_cselect', { category_id: categoryId, key })
  },

  trackBankStatementSelect: (
    statementId: string,
    isPaste: boolean,
    key?: string,
  ) => {
    trackEvent('bank_sselect', {
      statement_id: statementId,
      key,
      is_paste: isPaste,
    })
  },

  trackLogin: () => {
    trackEvent('login', { method: 'email' })
  },

  trackLogout: () => {
    trackEvent('logout', {})
  },

  trackRegister: () => {
    trackEvent('register', { method: 'email' })
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

  trackPwaInstallPrompt: () => {
    trackEvent('pwa_install_prompt', {})
  },

  trackPwaInstalled: () => {
    trackEvent('pwa_installed', {})
  },

  trackCategoryCacheStarted: (categoryId: string, phraseCount: number) => {
    trackEvent('category_cache_started', {
      category_id: categoryId,
      phrase_count: phraseCount,
    })
  },

  trackCategoryCacheCompleted: (categoryId: string, phraseCount: number) => {
    trackEvent('category_cache_completed', {
      category_id: categoryId,
      phrase_count: phraseCount,
    })
  },

  trackSettingsChanged: (setting: string, value: string | boolean | number) => {
    trackEvent('settings_changed', { setting, value })
  },

  trackReaderModeOpened: (categoryId: string, statementCount: number) => {
    trackEvent('reader_mode_opened', {
      category_id: categoryId,
      statement_count: statementCount,
    })
  },

  trackTextEditorOpened: (categoryId: string) => {
    trackEvent('text_editor_opened', { category_id: categoryId })
  },
})
