export type TelemetryPreference = 'unknown' | 'enabled' | 'disabled'
export type TelemetryDecision = Exclude<TelemetryPreference, 'unknown'>

export type TelemetryCountBucket = 'one' | 'two_to_five' | 'six_to_twenty' | 'more_than_twenty'
export type TelemetryDurationBucket = 'under_5s' | '5s_to_30s' | '31s_to_2m' | 'over_2m'

export type TelemetryOutcome =
  | { kind: 'phrase_composed'; source: 'input' | 'quick' | 'bank' | 'dialog'; count_bucket: TelemetryCountBucket }
  | {
    kind: 'speech_completed'
    result: 'completed' | 'failed' | 'cancelled'
    source: 'input' | 'quick' | 'bank' | 'dialog'
    mode: 'local' | 'cloud'
    count_bucket: TelemetryCountBucket
    duration_bucket: TelemetryDurationBucket
    failure_code?: 'engine_unavailable' | 'request_failed' | 'timeout' | 'cancelled'
  }
  | {
    kind: 'bank_action_completed'
    result: 'completed' | 'failed'
    source: 'phrase_inserted' | 'phrase_spoken' | 'reader_opened'
    failure_code?: 'validation_failed' | 'storage_failed' | 'permission_denied'
  }
  | {
    kind: 'dialog_action_completed'
    result: 'completed' | 'failed'
    source: 'message_sent' | 'suggestion_accepted' | 'suggestion_dismissed'
    failure_code?: 'validation_failed' | 'storage_failed' | 'permission_denied'
  }
  | {
    kind: 'sync_completed'
    result: 'completed' | 'failed'
    count_bucket: TelemetryCountBucket
    failure_code?: 'network_unavailable' | 'conflict' | 'server_error'
  }

export interface AppMetadata {
  version: string
  build: string
  platform: 'windows' | 'macos' | 'linux'
  os_version: string
  locale: 'ru' | 'ru-RU' | 'en' | 'en-US' | 'other'
}

export type StoredOutcome = TelemetryOutcome & {
  record_id: string
  occurred_at: string
  app_session_id: string
  app: AppMetadata
}

export interface SpoolRecord {
  id: string
  created_at: number
  payload: StoredOutcome
}
