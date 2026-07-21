export function endpointURL(base: string, suffix: string) {
  const url = new URL(base)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid metrics endpoint')
  url.pathname = `${url.pathname.replace(/\/$/, '')}${suffix}`
  url.search = ''
  url.hash = ''
  return url.toString()
}

export function retryDelayMs(attempt: number) {
  const maximum = Math.min(5 * 60_000, 1_000 * 2 ** Math.min(attempt, 9))
  return Math.round(maximum * (0.75 + Math.random() * 0.5))
}

export function isErrorCode(value: unknown, code: string) {
  return typeof value === 'object' && value !== null && 'error' in value && (value as { error?: unknown }).error === code
}

export function isAcknowledgement(value: unknown, batchId: string, recordCount: number) {
  return typeof value === 'object' && value !== null && 'batch_id' in value && 'accepted_records' in value && 'replayed' in value && (value as { batch_id?: unknown }).batch_id === batchId && (value as { accepted_records?: unknown }).accepted_records === recordCount && typeof (value as { replayed?: unknown }).replayed === 'boolean'
}

export async function readJSON(response: Response) {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}
