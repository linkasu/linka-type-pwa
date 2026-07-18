import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { RuntimeConfig } from '~/src/renderer/app-context'
import {
  createFirebaseAnalyticsConfig,
  hasFirebaseAnalyticsConfig,
  loadFirebaseAnalyticsSdk,
  setGoogleAnalyticsDisabled,
  type FirebaseAnalyticsSdk,
} from '~/plugins/firebase.client'
import {
  ANALYTICS_CONSENT,
  sanitizeAnalyticsParams,
  type AnalyticsConsentDecision,
  type AnalyticsConsentState,
  type AnalyticsEventName,
  type AnalyticsEventParams,
} from '~/types/analytics'
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_NOTICE_STORAGE_KEY,
  getStoredConsent,
  getStoredNoticeDismissed,
  setStoredValue,
  type AnalyticsStorage,
} from './consent'

export interface AnalyticsService {
  state: Ref<AnalyticsConsentState>
  noticeDismissed: Ref<boolean>
  isEnabled: ComputedRef<boolean>
  isReady: Ref<boolean>
  initialize: () => Promise<void>
  setConsent: (decision: AnalyticsConsentDecision) => Promise<void>
  dismissNotice: () => void
  track: <EventName extends AnalyticsEventName>(
    eventName: EventName,
    params: AnalyticsEventParams[EventName],
  ) => void
}

interface AnalyticsServiceOptions {
  storage?: AnalyticsStorage
  collectionAllowed?: boolean
  loadSdk?: () => Promise<FirebaseAnalyticsSdk>
  setNetworkEnabled?: (enabled: boolean) => Promise<void>
}

const setDesktopAnalyticsNetworkEnabled = async (enabled: boolean) => {
  if (typeof window === 'undefined' || !window.desktop?.privacy) return
  await window.desktop.privacy.setAnalyticsEnabled(enabled)
}

export function createAnalyticsService(
  config: RuntimeConfig,
  options: AnalyticsServiceOptions = {},
): AnalyticsService {
  const storage = options.storage ?? localStorage
  const state = ref<AnalyticsConsentState>(getStoredConsent(storage))
  const noticeDismissed = ref(getStoredNoticeDismissed(storage))
  const isReady = ref(false)
  const isEnabled = computed(() => state.value === ANALYTICS_CONSENT.Enabled)
  const loadSdk = options.loadSdk ?? loadFirebaseAnalyticsSdk
  const setNetworkEnabled = options.setNetworkEnabled ?? setDesktopAnalyticsNetworkEnabled
  const collectionAllowed = options.collectionAllowed ?? config.public.analyticsCollectionAllowed
  const firebaseConfig = createFirebaseAnalyticsConfig(config)
  let sdk: FirebaseAnalyticsSdk | null = null
  let firebaseApp: ReturnType<FirebaseAnalyticsSdk['initializeApp']> | null = null
  let analytics: ReturnType<FirebaseAnalyticsSdk['initializeAnalytics']> | null = null
  let transition = 0

  setStoredValue(storage, ANALYTICS_CONSENT_STORAGE_KEY, state.value)

  const deactivate = async () => {
    setGoogleAnalyticsDisabled(firebaseConfig.measurementId, true)
    await setNetworkEnabled(false).catch((): undefined => undefined)

    if (sdk && analytics) {
      try {
        sdk.setCollectionEnabled(analytics, false)
      } catch {
        // Continue deleting the Firebase app even if collection shutdown fails.
      }
    }
    if (sdk && firebaseApp) {
      await sdk.deleteApp(firebaseApp).catch((): undefined => undefined)
    }

    analytics = null
    firebaseApp = null
    sdk = null
    isReady.value = false
  }

  const closeStaleNetwork = async (currentTransition: number) => {
    const isCurrent = currentTransition === transition
      && state.value === ANALYTICS_CONSENT.Enabled
    if (!isCurrent && state.value !== ANALYTICS_CONSENT.Enabled) {
      await setNetworkEnabled(false).catch((): undefined => undefined)
    }
    return isCurrent
  }

  const activate = async (currentTransition: number) => {
    if (!collectionAllowed || !hasFirebaseAnalyticsConfig(firebaseConfig)) {
      await deactivate()
      return
    }
    if (isReady.value) return

    setGoogleAnalyticsDisabled(firebaseConfig.measurementId, false)
    await setNetworkEnabled(true).catch((): undefined => undefined)
    if (!(await closeStaleNetwork(currentTransition))) return

    try {
      const loadedSdk = await loadSdk()
      if (!(await closeStaleNetwork(currentTransition))) return
      if (!(await loadedSdk.isSupported())) {
        await deactivate()
        return
      }
      if (!(await closeStaleNetwork(currentTransition))) return

      const loadedApp = loadedSdk.initializeApp(firebaseConfig)
      const loadedAnalytics = loadedSdk.initializeAnalytics(loadedApp)
      sdk = loadedSdk
      firebaseApp = loadedApp
      analytics = loadedAnalytics
      loadedSdk.setCollectionEnabled(loadedAnalytics, true)
      isReady.value = true
    } catch {
      await deactivate()
    }
  }

  const initialize = async () => {
    const currentTransition = ++transition
    if (state.value === ANALYTICS_CONSENT.Enabled) {
      await activate(currentTransition)
    } else {
      await deactivate()
    }
  }

  const setConsent = async (decision: AnalyticsConsentDecision) => {
    const currentTransition = ++transition
    state.value = decision
    noticeDismissed.value = true
    setStoredValue(storage, ANALYTICS_CONSENT_STORAGE_KEY, decision)
    setStoredValue(storage, ANALYTICS_NOTICE_STORAGE_KEY, 'true')

    if (decision === ANALYTICS_CONSENT.Enabled) {
      await activate(currentTransition)
    } else {
      await deactivate()
    }
  }

  const dismissNotice = () => {
    noticeDismissed.value = true
    setStoredValue(storage, ANALYTICS_NOTICE_STORAGE_KEY, 'true')
  }

  const track = <EventName extends AnalyticsEventName>(
    eventName: EventName,
    params: AnalyticsEventParams[EventName],
  ) => {
    if (state.value !== ANALYTICS_CONSENT.Enabled || !sdk || !analytics) return
    try {
      sdk.logEvent(analytics, eventName, sanitizeAnalyticsParams(eventName, params))
    } catch {
      // Analytics must never affect an application action.
    }
  }

  return {
    state,
    noticeDismissed,
    isEnabled,
    isReady,
    initialize,
    setConsent,
    dismissNotice,
    track,
  }
}
