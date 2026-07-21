import type { TelemetryOutcome } from './types.js'

const countBuckets = ['one', 'two_to_five', 'six_to_twenty', 'more_than_twenty'] as const
const durationBuckets = ['under_5s', '5s_to_30s', '31s_to_2m', 'over_2m'] as const
const sources = ['input', 'quick', 'bank', 'dialog'] as const
const playbackFailures = ['engine_unavailable', 'request_failed', 'timeout', 'cancelled'] as const
const actionFailures = ['validation_failed', 'storage_failed', 'permission_denied'] as const
const syncFailures = ['network_unavailable', 'conflict', 'server_error'] as const

export function sanitizeTelemetryOutcome(value: unknown): TelemetryOutcome | undefined {
  if (!isObject(value) || typeof value.kind !== 'string') return undefined

  switch (value.kind) {
    case 'phrase_composed':
      if (!hasOnly(value, ['kind', 'source', 'count_bucket']) || !oneOf(value.source, sources) || !oneOf(value.count_bucket, countBuckets)) return undefined
      return { kind: value.kind, source: value.source, count_bucket: value.count_bucket }
    case 'speech_completed':
      if (!hasOnly(value, ['kind', 'result', 'source', 'mode', 'count_bucket', 'duration_bucket', 'failure_code'])) return undefined
      if (!oneOf(value.result, ['completed', 'failed', 'cancelled']) || !oneOf(value.source, sources) || !oneOf(value.mode, ['local', 'cloud']) || !oneOf(value.count_bucket, countBuckets) || !oneOf(value.duration_bucket, durationBuckets)) return undefined
      const playbackFailure = value.failure_code
      if (playbackFailure === undefined) return { kind: value.kind, result: value.result, source: value.source, mode: value.mode, count_bucket: value.count_bucket, duration_bucket: value.duration_bucket }
      if (!oneOf(playbackFailure, playbackFailures)) return undefined
      return { kind: value.kind, result: value.result, source: value.source, mode: value.mode, count_bucket: value.count_bucket, duration_bucket: value.duration_bucket, failure_code: playbackFailure }
    case 'bank_action_completed':
      if (!hasOnly(value, ['kind', 'result', 'source', 'failure_code'])) return undefined
      if (!oneOf(value.result, ['completed', 'failed']) || !oneOf(value.source, ['phrase_inserted', 'phrase_spoken', 'reader_opened'])) return undefined
      const bankFailure = value.failure_code
      if (bankFailure === undefined) return { kind: value.kind, result: value.result, source: value.source }
      if (!oneOf(bankFailure, actionFailures)) return undefined
      return { kind: value.kind, result: value.result, source: value.source, failure_code: bankFailure }
    case 'dialog_action_completed':
      if (!hasOnly(value, ['kind', 'result', 'source', 'failure_code'])) return undefined
      if (!oneOf(value.result, ['completed', 'failed']) || !oneOf(value.source, ['message_sent', 'suggestion_accepted', 'suggestion_dismissed'])) return undefined
      const dialogFailure = value.failure_code
      if (dialogFailure === undefined) return { kind: value.kind, result: value.result, source: value.source }
      if (!oneOf(dialogFailure, actionFailures)) return undefined
      return { kind: value.kind, result: value.result, source: value.source, failure_code: dialogFailure }
    case 'sync_completed':
      if (!hasOnly(value, ['kind', 'result', 'count_bucket', 'failure_code'])) return undefined
      if (!oneOf(value.result, ['completed', 'failed']) || !oneOf(value.count_bucket, countBuckets)) return undefined
      const syncFailure = value.failure_code
      if (syncFailure === undefined) return { kind: value.kind, result: value.result, count_bucket: value.count_bucket }
      if (!oneOf(syncFailure, syncFailures)) return undefined
      return { kind: value.kind, result: value.result, count_bucket: value.count_bucket, failure_code: syncFailure }
    default:
      return undefined
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnly(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every(key => keys.includes(key))
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}
