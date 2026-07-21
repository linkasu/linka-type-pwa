export const ANALYTICS_CONSENT = {
  Unknown: 'Unknown',
  Enabled: 'Enabled',
  Disabled: 'Disabled',
} as const

export type AnalyticsConsentState = typeof ANALYTICS_CONSENT[keyof typeof ANALYTICS_CONSENT]
export type AnalyticsConsentDecision = Exclude<AnalyticsConsentState, 'Unknown'>

export type TelemetryOutcome = import('../electron/telemetry/types').TelemetryOutcome
export type TelemetryCountBucket = import('../electron/telemetry/types').TelemetryCountBucket
