import type { TelemetryCountBucket, TelemetryOutcome } from '~/types/analytics'

type TrackOutcome = (outcome: TelemetryOutcome) => void

const countBucket = (count: number): TelemetryCountBucket => {
  if (count <= 1) return 'one'
  if (count <= 5) return 'two_to_five'
  if (count <= 20) return 'six_to_twenty'
  return 'more_than_twenty'
}

export const createAnalyticsTrackers = (trackOutcome: TrackOutcome) => ({
  trackPredicatorUse: (_position: number): void => {},
  trackSpotlight: (_action: 'open' | 'close'): void => {},
  trackSay: (characterCount: number, _download = false) => {
    if (characterCount > 0) trackOutcome({ kind: 'phrase_composed', source: 'input', count_bucket: countBucket(characterCount) })
  },
  trackQuickesSay: (_position: number): void => {
    trackOutcome({ kind: 'phrase_composed', source: 'quick', count_bucket: 'one' })
  },
  trackBankCategorySelect: (): void => {},
  trackBankStatementSelect: (_isPaste: boolean): void => {
    trackOutcome({ kind: 'phrase_composed', source: 'bank', count_bucket: 'one' })
  },
  trackLogin: (): void => {},
  trackLogout: (): void => {},
  trackRegister: (): void => {},
  trackUpdatePromptShown: (): void => {},
  trackUpdateAccepted: (): void => {},
  trackMobileAppPrompt: (_platform: 'ios' | 'android'): void => {},
  trackMobileAppLinkClicked: (_platform: 'ios' | 'android'): void => {},
  trackCategoryCacheStarted: (_itemCount: number): void => {},
  trackCategoryCacheCompleted: (_itemCount: number): void => {},
})
