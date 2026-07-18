import { createAnalyticsService } from '~/composables/analytics/service'
import type { FirebaseAnalyticsSdk } from '~/plugins/firebase.client'
import {
  ANALYTICS_CONSENT,
  ANALYTICS_EVENT_PARAMETER_KEYS,
  sanitizeAnalyticsParams,
} from '~/types/analytics'
import type { RuntimeConfig } from '~/src/renderer/app-context'

const createStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    values,
  }
}

const config: RuntimeConfig = {
  public: {
    apiBaseUrl: 'https://backend.linka.su',
    firebaseApiKey: 'key',
    firebaseProjectId: 'project',
    firebaseAppId: 'app',
    firebaseMeasurementId: 'G-TEST',
    analyticsCollectionAllowed: true,
  },
}

const createSdk = () => {
  const app = {} as ReturnType<FirebaseAnalyticsSdk['initializeApp']>
  const analytics = {} as ReturnType<FirebaseAnalyticsSdk['initializeAnalytics']>
  const sdk: FirebaseAnalyticsSdk = {
    isSupported: vi.fn(async () => true),
    initializeApp: vi.fn(() => app),
    deleteApp: vi.fn(async () => undefined),
    initializeAnalytics: vi.fn(() => analytics),
    setCollectionEnabled: vi.fn(),
    logEvent: vi.fn(),
  }
  return sdk
}

describe('analytics consent FSM', () => {
  it('persists Unknown and does not load Firebase or open its network', async () => {
    const storage = createStorage()
    const sdk = createSdk()
    const loadSdk = vi.fn(async () => sdk)
    const setNetworkEnabled = vi.fn(async () => undefined)
    const service = createAnalyticsService(config, { storage, loadSdk, setNetworkEnabled })

    await service.initialize()

    expect(service.state.value).toBe(ANALYTICS_CONSENT.Unknown)
    expect(storage.values.get('analytics_consent')).toBe(ANALYTICS_CONSENT.Unknown)
    expect(loadSdk).not.toHaveBeenCalled()
    expect(setNetworkEnabled).toHaveBeenLastCalledWith(false)
    expect(service.isReady.value).toBe(false)
  })

  it('loads Firebase only after an explicit Enabled transition', async () => {
    const storage = createStorage()
    const sdk = createSdk()
    const loadSdk = vi.fn(async () => sdk)
    const setNetworkEnabled = vi.fn(async () => undefined)
    const service = createAnalyticsService(config, { storage, loadSdk, setNetworkEnabled })

    await service.initialize()
    await service.setConsent(ANALYTICS_CONSENT.Enabled)

    expect(storage.values.get('analytics_consent')).toBe(ANALYTICS_CONSENT.Enabled)
    expect(loadSdk).toHaveBeenCalledTimes(1)
    expect(setNetworkEnabled.mock.calls.map(([enabled]) => enabled)).toEqual([false, true])
    expect(sdk.initializeApp).toHaveBeenCalledTimes(1)
    expect(sdk.setCollectionEnabled).toHaveBeenLastCalledWith(expect.anything(), true)
    expect(service.isReady.value).toBe(true)
  })

  it('closes collection immediately when changed to Disabled', async () => {
    const storage = createStorage()
    const sdk = createSdk()
    const setNetworkEnabled = vi.fn(async () => undefined)
    const service = createAnalyticsService(config, {
      storage,
      loadSdk: async () => sdk,
      setNetworkEnabled,
    })

    await service.setConsent(ANALYTICS_CONSENT.Enabled)
    await service.setConsent(ANALYTICS_CONSENT.Disabled)

    expect(service.state.value).toBe(ANALYTICS_CONSENT.Disabled)
    expect(setNetworkEnabled).toHaveBeenLastCalledWith(false)
    expect(sdk.setCollectionEnabled).toHaveBeenLastCalledWith(expect.anything(), false)
    expect(sdk.deleteApp).toHaveBeenCalledTimes(1)
    expect(service.isReady.value).toBe(false)
  })

  it('keeps the network closed when Disabled wins an in-flight enable transition', async () => {
    const storage = createStorage()
    let finishOpeningNetwork: (() => void) | undefined
    const setNetworkEnabled = vi.fn((enabled: boolean) => {
      if (!enabled) return Promise.resolve()
      return new Promise<void>((resolve) => {
        finishOpeningNetwork = resolve
      })
    })
    const loadSdk = vi.fn(async () => createSdk())
    const service = createAnalyticsService(config, { storage, loadSdk, setNetworkEnabled })

    const enabling = service.setConsent(ANALYTICS_CONSENT.Enabled)
    await service.setConsent(ANALYTICS_CONSENT.Disabled)
    finishOpeningNetwork?.()
    await enabling

    expect(service.state.value).toBe(ANALYTICS_CONSENT.Disabled)
    expect(setNetworkEnabled).toHaveBeenLastCalledWith(false)
    expect(loadSdk).not.toHaveBeenCalled()
  })

  it('keeps debug and test builds collection-free even after consent', async () => {
    const storage = createStorage()
    const loadSdk = vi.fn(async () => createSdk())
    const setNetworkEnabled = vi.fn(async () => undefined)
    const service = createAnalyticsService(config, {
      storage,
      loadSdk,
      setNetworkEnabled,
      collectionAllowed: false,
    })

    await service.setConsent(ANALYTICS_CONSENT.Enabled)

    expect(service.state.value).toBe(ANALYTICS_CONSENT.Enabled)
    expect(loadSdk).not.toHaveBeenCalled()
    expect(setNetworkEnabled).toHaveBeenLastCalledWith(false)
  })

  it('migrates explicit legacy consent values', () => {
    const enabled = createAnalyticsService(config, {
      storage: createStorage({ analytics_consent: 'granted' }),
      collectionAllowed: false,
    })
    const disabled = createAnalyticsService(config, {
      storage: createStorage({ analytics_consent: 'denied' }),
      collectionAllowed: false,
    })

    expect(enabled.state.value).toBe(ANALYTICS_CONSENT.Enabled)
    expect(disabled.state.value).toBe(ANALYTICS_CONSENT.Disabled)
  })

  it('enforces the event and parameter allowlist at runtime', () => {
    const forbidden = /phrase|text|email|uid|category|card|chat|audio|path|error/i
    for (const [eventName, keys] of Object.entries(ANALYTICS_EVENT_PARAMETER_KEYS)) {
      expect(eventName).not.toMatch(forbidden)
      for (const key of keys) expect(key).not.toMatch(forbidden)
    }

    const sanitized = sanitizeAnalyticsParams(
      'predicator_use',
      { position: 2, word: 'private' } as never,
    )
    expect(sanitized).toEqual({ position: 2 })
  })
})
