import { ANALYTICS_CONSENT, type AnalyticsConsentState } from '~/types/analytics'

export const ANALYTICS_CONSENT_STORAGE_KEY = 'analytics_consent'
export const ANALYTICS_NOTICE_STORAGE_KEY = 'analytics_notice_dismissed'

export interface AnalyticsStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export const getStoredConsent = (storage: AnalyticsStorage): AnalyticsConsentState => {
  try {
    const stored = storage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)
    if (stored === ANALYTICS_CONSENT.Enabled || stored === 'granted') {
      return ANALYTICS_CONSENT.Enabled
    }
    if (stored === ANALYTICS_CONSENT.Disabled || stored === 'denied') {
      return ANALYTICS_CONSENT.Disabled
    }
  } catch {
    return ANALYTICS_CONSENT.Unknown
  }

  return ANALYTICS_CONSENT.Unknown
}

export const getStoredNoticeDismissed = (storage: AnalyticsStorage) => {
  try {
    return storage.getItem(ANALYTICS_NOTICE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const setStoredValue = (
  storage: AnalyticsStorage,
  key: string,
  value: string,
) => {
  try {
    storage.setItem(key, value)
  } catch {
    // Consent remains active for this process when storage is unavailable.
  }
}
