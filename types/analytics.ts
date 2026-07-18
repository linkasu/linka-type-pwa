export const ANALYTICS_CONSENT = {
  Unknown: 'Unknown',
  Enabled: 'Enabled',
  Disabled: 'Disabled',
} as const

export type AnalyticsConsentState = typeof ANALYTICS_CONSENT[keyof typeof ANALYTICS_CONSENT]
export type AnalyticsConsentDecision = Exclude<AnalyticsConsentState, 'Unknown'>

type NoAnalyticsParams = Record<never, never>

export interface AnalyticsEventParams {
  predicator_use: { position: number }
  spotlight: { action: 'open' | 'close' }
  say: {
    length_bucket: 'empty' | 'short' | 'medium' | 'long'
    delivery: 'playback' | 'download'
  }
  quickes_say: { position: number }
  bank_cselect: NoAnalyticsParams
  bank_sselect: { is_paste: boolean }
  login: NoAnalyticsParams
  logout: NoAnalyticsParams
  register: NoAnalyticsParams
  update_prompt_shown: NoAnalyticsParams
  update_accepted: NoAnalyticsParams
  mobile_app_prompt_shown: { platform: 'ios' | 'android' }
  mobile_app_link_clicked: { platform: 'ios' | 'android' }
  bank_cache_started: { item_count: number }
  bank_cache_completed: { item_count: number }
}

export type AnalyticsEventName = keyof AnalyticsEventParams
export type AnalyticsParamValue = string | number | boolean

export const ANALYTICS_EVENT_PARAMETER_KEYS = {
  predicator_use: ['position'],
  spotlight: ['action'],
  say: ['length_bucket', 'delivery'],
  quickes_say: ['position'],
  bank_cselect: [],
  bank_sselect: ['is_paste'],
  login: [],
  logout: [],
  register: [],
  update_prompt_shown: [],
  update_accepted: [],
  mobile_app_prompt_shown: ['platform'],
  mobile_app_link_clicked: ['platform'],
  bank_cache_started: ['item_count'],
  bank_cache_completed: ['item_count'],
} as const satisfies {
  [EventName in AnalyticsEventName]: readonly (keyof AnalyticsEventParams[EventName])[]
}

export function sanitizeAnalyticsParams<EventName extends AnalyticsEventName>(
  eventName: EventName,
  params: AnalyticsEventParams[EventName],
): Record<string, AnalyticsParamValue> {
  const source = params as unknown as Record<string, unknown>
  const sanitized: Record<string, AnalyticsParamValue> = {}

  for (const key of ANALYTICS_EVENT_PARAMETER_KEYS[eventName] as readonly string[]) {
    const value = source[key]
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value
    }
  }

  return sanitized
}
