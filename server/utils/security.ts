import type { H3Event } from 'h3'

export function getRequestOrigin(event: H3Event): string | null {
  const origin = getHeader(event, 'origin')
  if (origin) {
    return origin
  }
  return null
}

export function getExpectedOrigin(event: H3Event): string | null {
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host')
  if (!host) return null

  const proto =
    getHeader(event, 'x-forwarded-proto') ||
    (event.node.req.socket.encrypted ? 'https' : 'http')

  return `${proto}://${host}`
}

export function assertSameOrigin(event: H3Event) {
  const origin = getRequestOrigin(event)
  if (!origin) return

  const expected = getExpectedOrigin(event)
  if (!expected) return

  if (origin !== expected) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Invalid request origin',
    })
  }
}

export function isSecureRequest(event: H3Event): boolean {
  // Check x-forwarded-proto first
  const proto = getHeader(event, 'x-forwarded-proto')
  if (proto) {
    return proto === 'https'
  }

  // Check if socket is encrypted
  if (event.node.req.socket.encrypted) {
    return true
  }

  // For Yandex Cloud Serverless - check host for yandexcloud.net domain
  const host = getHeader(event, 'host') || getHeader(event, 'x-forwarded-host') || ''
  if (host.includes('yandexcloud.net') || host.includes('containers.yandexcloud.net')) {
    return true
  }

  // Default to secure in production (non-localhost)
  if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
    return true
  }

  return false
}
