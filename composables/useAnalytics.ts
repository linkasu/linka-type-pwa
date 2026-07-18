import { createAnalyticsTrackers } from './analytics/trackers'

export const useAnalytics = () => {
  const { analytics } = useAppServices()
  const trackers = createAnalyticsTrackers(analytics.track)

  return {
    consentState: analytics.state,
    noticeDismissed: analytics.noticeDismissed,
    isEnabled: analytics.isEnabled,
    isReady: analytics.isReady,
    setConsent: analytics.setConsent,
    dismissNotice: analytics.dismissNotice,
    ...trackers,
  }
}
