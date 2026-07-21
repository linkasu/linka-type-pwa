import { sanitizeTelemetryOutcome } from './sanitize.js'
import type { SpoolRecord } from './types.js'

export function isValidSpoolRecord(value: unknown): value is SpoolRecord {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.created_at !== 'number' || !isObject(value.payload)) return false
  const payload = value.payload
  const keys = ['record_id', 'occurred_at', 'app_session_id', 'app', 'kind', 'result', 'source', 'mode', 'count_bucket', 'duration_bucket', 'failure_code']
  if (!Object.keys(payload).every(key => keys.includes(key)) || !isUUID(value.id) || !Number.isFinite(value.created_at) || !isUUID(payload.record_id) || !isTimestamp(payload.occurred_at) || !isUUID(payload.app_session_id) || !isAppMetadata(payload.app)) return false
  const outcome = Object.fromEntries(Object.entries(payload).filter(([key]) => !['record_id', 'occurred_at', 'app_session_id', 'app'].includes(key)))
  return sanitizeTelemetryOutcome(outcome) !== undefined
}

export function isValidActiveBatch(value: unknown, subjectKey: string, recordSuffix: string): value is {
  batchId: string
  body: string
  files: string[]
  recordCount: number
  subjectKey: string
  sentAt: string
} {
  if (!isObject(value)) return false
  return typeof value.batchId === 'string' && typeof value.body === 'string' && Array.isArray(value.files) && value.files.every(file => typeof file === 'string' && file.endsWith(recordSuffix)) && typeof value.recordCount === 'number' && value.recordCount === value.files.length && value.subjectKey === subjectKey && typeof value.sentAt === 'string' && Date.parse(value.sentAt) > Date.now() - 7 * 24 * 60 * 60 * 1000
}

function isAppMetadata(value: unknown) {
  if (!isObject(value) || !hasExactKeys(value, ['version', 'build', 'platform', 'os_version', 'locale'])) return false
  return isSafeValue(value.version) && isSafeValue(value.build) && isSafeValue(value.os_version)
    && (value.platform === 'windows' || value.platform === 'macos' || value.platform === 'linux')
    && (value.locale === 'ru' || value.locale === 'ru-RU' || value.locale === 'en' || value.locale === 'en-US' || value.locale === 'other')
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).length === keys.length && Object.keys(value).every(key => keys.includes(key))
}

function isSafeValue(value: unknown) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,95}$/.test(value)
}

function isTimestamp(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isUUID(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
