import type { Session } from 'electron'

export const ANALYTICS_NETWORK_FILTER = [
  '*://*.google-analytics.com/*',
  '*://google-analytics.com/*',
  '*://analytics.google.com/*',
  '*://*.googletagmanager.com/*',
  '*://googletagmanager.com/*',
  '*://*.app-measurement.com/*',
  '*://app-measurement.com/*',
  '*://firebaseinstallations.googleapis.com/*',
  '*://firebase.googleapis.com/*',
]

const isHostOrSubdomain = (hostname: string, domain: string) => (
  hostname === domain || hostname.endsWith(`.${domain}`)
)

export const isAnalyticsNetworkUrl = (value: string) => {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false

    return (
      isHostOrSubdomain(url.hostname, 'google-analytics.com')
      || url.hostname === 'analytics.google.com'
      || isHostOrSubdomain(url.hostname, 'googletagmanager.com')
      || isHostOrSubdomain(url.hostname, 'app-measurement.com')
      || url.hostname === 'firebaseinstallations.googleapis.com'
      || url.hostname === 'firebase.googleapis.com'
    )
  } catch {
    return false
  }
}

export class AnalyticsNetworkPolicy {
  private enabled = false

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  shouldBlock(url: string) {
    return !this.enabled && isAnalyticsNetworkUrl(url)
  }
}

export const registerAnalyticsNetworkGuard = (
  targetSession: Session,
  policy: AnalyticsNetworkPolicy,
) => {
  targetSession.webRequest.onBeforeRequest(
    { urls: ANALYTICS_NETWORK_FILTER },
    (details, callback) => {
      callback({ cancel: policy.shouldBlock(details.url) })
    },
  )
}
