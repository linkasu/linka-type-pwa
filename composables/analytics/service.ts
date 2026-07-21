import { computed, ref, type ComputedRef, type Ref } from 'vue'
import {
  ANALYTICS_CONSENT,
  type AnalyticsConsentDecision,
  type AnalyticsConsentState,
  type TelemetryOutcome,
} from '~/types/analytics'

export interface AnalyticsService {
  state: Ref<AnalyticsConsentState>
  noticeDismissed: Ref<boolean>
  isEnabled: ComputedRef<boolean>
  isReady: Ref<boolean>
  initialize: () => Promise<void>
  setConsent: (decision: AnalyticsConsentDecision) => Promise<void>
  dismissNotice: () => void
  track: (outcome: TelemetryOutcome) => void
}

const fromPreference = (preference: 'unknown' | 'enabled' | 'disabled'): AnalyticsConsentState => {
  if (preference === 'enabled') return ANALYTICS_CONSENT.Enabled
  if (preference === 'disabled') return ANALYTICS_CONSENT.Disabled
  return ANALYTICS_CONSENT.Unknown
}

export function createAnalyticsService(): AnalyticsService {
  const state = ref<AnalyticsConsentState>(ANALYTICS_CONSENT.Unknown)
  const noticeDismissed = ref(false)
  const isReady = ref(false)
  const isEnabled = computed(() => state.value === ANALYTICS_CONSENT.Enabled)

  const initialize = async () => {
    const privacy = desktopPrivacy()
    if (!privacy) return
    try {
      state.value = fromPreference(await privacy.getTelemetryPreference())
      isReady.value = true
    } catch {
      state.value = ANALYTICS_CONSENT.Unknown
    }
  }

  const setConsent = async (decision: AnalyticsConsentDecision) => {
    const privacy = desktopPrivacy()
    if (!privacy) return
    const preference = await privacy.setTelemetryPreference(
      decision === ANALYTICS_CONSENT.Enabled ? 'enabled' : 'disabled',
    )
    state.value = fromPreference(preference)
    noticeDismissed.value = true
  }

  const dismissNotice = () => {
    noticeDismissed.value = true
  }

  const track = (outcome: TelemetryOutcome) => {
    if (state.value !== ANALYTICS_CONSENT.Enabled) return
    desktopPrivacy()?.recordOutcome(outcome)
  }

  return { state, noticeDismissed, isEnabled, isReady, initialize, setConsent, dismissNotice, track }
}

function desktopPrivacy() {
  return typeof window === 'undefined' ? undefined : window.desktop?.privacy
}
