import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
} from 'axios'
import { fromBase64, toBase64 } from './base64'
import type {
  DesktopBackendBodyPayload,
  DesktopBackendRequestPayload,
  DesktopBackendResponsePayload,
  RequestConfig,
} from './types'

export const hasDesktopBackend = () =>
  typeof window !== 'undefined' && Boolean(window.desktop?.backend)

const normalizeHeaders = (headers: RequestConfig['headers']): Record<string, string> => {
  const raw = headers instanceof AxiosHeaders ? headers.toJSON() : headers
  if (!raw) return {}

  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === undefined || value === null) continue
    normalized[key] = Array.isArray(value) ? value.join(', ') : String(value)
  }
  return normalized
}

const buildRequestUrl = (baseURL: string, config: RequestConfig): string => {
  const rawUrl = config.url || ''
  const url = /^https?:\/\//i.test(rawUrl)
    ? new URL(rawUrl)
    : new URL(rawUrl, baseURL.endsWith('/') ? baseURL : `${baseURL}/`)

  const params = config.params
  if (params && typeof params === 'object') {
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        value.forEach((item) => {
          url.searchParams.append(key, String(item))
        })
      } else {
        url.searchParams.append(key, String(value))
      }
    }
  }

  return url.toString()
}

const isFormDataValue = (value: unknown): value is FormData =>
  typeof FormData !== 'undefined' && value instanceof FormData

const buildRequestBody = async (
  config: RequestConfig,
): Promise<DesktopBackendBodyPayload | null> => {
  const method = String(config.method || 'GET').toUpperCase()
  if (method === 'GET' || method === 'HEAD') return null

  const data = config.data
  if (data === undefined || data === null || data === '') return null

  if (isFormDataValue(data)) {
    const entries: Array<
      | { kind: 'text'; name: string; value: string }
      | {
        kind: 'file'
        name: string
        filename?: string
        contentType?: string
        base64: string
      }
    > = []

    for (const [name, value] of data.entries()) {
      if (typeof value === 'string') {
        entries.push({ kind: 'text', name, value })
        continue
      }
      const file = value as File
      const bytes = new Uint8Array(await file.arrayBuffer())
      entries.push({
        kind: 'file',
        name,
        filename: file.name || 'file',
        contentType: file.type || 'application/octet-stream',
        base64: toBase64(bytes),
      })
    }

    return { kind: 'form-data', entries }
  }

  if (typeof data === 'string') {
    return { kind: 'text', value: data }
  }

  if (data instanceof ArrayBuffer) {
    return {
      kind: 'binary',
      base64: toBase64(new Uint8Array(data)),
      contentType: 'application/octet-stream',
    }
  }

  if (ArrayBuffer.isView(data)) {
    const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
    return {
      kind: 'binary',
      base64: toBase64(bytes),
      contentType: 'application/octet-stream',
    }
  }

  return { kind: 'json', value: data }
}

export const createDesktopAdapter = (baseURL: string): AxiosAdapter => {
  return async (config) => {
    if (!window.desktop?.backend) {
      throw new AxiosError('Desktop backend bridge is not available', 'ERR_NETWORK', config)
    }

    const requestConfig = config as RequestConfig
    const payload: DesktopBackendRequestPayload = {
      url: buildRequestUrl(baseURL, requestConfig),
      method: String(requestConfig.method || 'GET').toUpperCase(),
      headers: normalizeHeaders(requestConfig.headers),
      body: await buildRequestBody(requestConfig),
      responseType:
        requestConfig.responseType === 'arraybuffer'
          ? 'arraybuffer'
          : requestConfig.responseType === 'text'
            ? 'text'
            : 'json',
    }

    const result = await window.desktop.backend.request(payload) as DesktopBackendResponsePayload

    let data: unknown = result.data
    if (result.dataType === 'base64' && typeof result.data === 'string') {
      data = fromBase64(result.data)
    }

    const response: AxiosResponse = {
      data,
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
      config,
      request: payload,
    }

    if (!result.ok) {
      throw new AxiosError(
        `Request failed with status code ${result.status}`,
        'ERR_BAD_RESPONSE',
        config,
        payload,
        response,
      )
    }

    return response
  }
}
