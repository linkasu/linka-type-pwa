import {
  AnalyticsNetworkPolicy,
  isAnalyticsNetworkUrl,
} from '../../electron/privacyNetwork'

describe('Electron analytics network policy', () => {
  it.each([
    'https://www.google-analytics.com/g/collect',
    'https://region1.google-analytics.com/g/collect',
    'https://www.googletagmanager.com/gtag/js?id=G-TEST',
    'https://firebaseinstallations.googleapis.com/v1/projects/test/installations',
    'https://firebase.googleapis.com/v1alpha/projects/-/apps/test/webConfig',
    'https://app-measurement.com/config/app/test',
  ])('recognizes analytics endpoint %s', (url) => {
    expect(isAnalyticsNetworkUrl(url)).toBe(true)
  })

  it.each([
    'https://backend.linka.su/v1/auth',
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
    'https://securetoken.googleapis.com/v1/token',
    'https://firebasestorage.googleapis.com/v0/b/project/o/item',
    'https://storage.googleapis.com/project/item',
    'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize',
  ])('does not classify functional endpoint %s as analytics', (url) => {
    expect(isAnalyticsNetworkUrl(url)).toBe(false)
  })

  it('blocks by default and permits analytics only after Enabled', () => {
    const policy = new AnalyticsNetworkPolicy()
    const analyticsUrl = 'https://www.google-analytics.com/g/collect'

    expect(policy.shouldBlock(analyticsUrl)).toBe(true)
    expect(policy.shouldBlock('https://backend.linka.su/v1/user/state')).toBe(false)

    policy.setEnabled(true)
    expect(policy.shouldBlock(analyticsUrl)).toBe(false)

    policy.setEnabled(false)
    expect(policy.shouldBlock(analyticsUrl)).toBe(true)
  })
})
