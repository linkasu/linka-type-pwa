import { ipcMain } from 'electron'
import { Buffer } from 'node:buffer'

export type BackendFormDataEntry =
  | {
    kind: 'text'
    name: string
    value: string
  }
  | {
    kind: 'file'
    name: string
    filename?: string
    contentType?: string
    base64: string
  }

export type BackendBodyPayload =
  | { kind: 'json'; value: unknown }
  | { kind: 'text'; value: string }
  | { kind: 'binary'; base64: string; contentType?: string }
  | { kind: 'form-data'; entries: BackendFormDataEntry[] }

export type BackendRequestPayload = {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: BackendBodyPayload | null
  responseType?: 'json' | 'text' | 'arraybuffer'
}

export type BackendResponsePayload = {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  dataType: 'json' | 'text' | 'base64'
  data: unknown
}

type BackendRequestBody = string | Buffer | FormData | undefined

const headersToObject = (headers: Headers): Record<string, string> => {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

const buildRequestBody = (body?: BackendBodyPayload | null): BackendRequestBody => {
  if (!body) return undefined

  if (body.kind === 'json') {
    return JSON.stringify(body.value)
  }

  if (body.kind === 'text') {
    return body.value
  }

  if (body.kind === 'binary') {
    return Buffer.from(body.base64, 'base64')
  }

  const form = new FormData()
  for (const entry of body.entries) {
    if (entry.kind === 'text') {
      form.append(entry.name, entry.value)
      continue
    }

    const buffer = Buffer.from(entry.base64, 'base64')
    const blob = new Blob([buffer], {
      type: entry.contentType || 'application/octet-stream',
    })
    form.append(entry.name, blob, entry.filename || 'file')
  }
  return form
}

const performBackendRequest = async (
  payload: BackendRequestPayload,
): Promise<BackendResponsePayload> => {
  const method = String(payload.method || 'GET').toUpperCase()
  const headers = { ...(payload.headers || {}) }
  const body = buildRequestBody(payload.body)

  if (payload.body?.kind === 'json' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (payload.body?.kind === 'form-data') {
    delete headers['Content-Type']
    delete headers['content-type']
  }

  const response = await fetch(payload.url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  })

  const responseHeaders = headersToObject(response.headers)
  const contentType = response.headers.get('content-type') || ''
  const wantsArrayBuffer = payload.responseType === 'arraybuffer'
  const wantsText = payload.responseType === 'text'

  if (wantsArrayBuffer) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      dataType: 'base64',
      data: Buffer.from(bytes).toString('base64'),
    }
  }

  if (!wantsText && contentType.includes('application/json')) {
    const data = await response.json().catch((): null => null)
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      dataType: 'json',
      data,
    }
  }

  const text = await response.text()
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    dataType: 'text',
    data: text,
  }
}

export const registerBackendRequestIpc = () => {
  ipcMain.handle('backend:request', async (_event, payload: BackendRequestPayload) => {
    try {
      return await performBackendRequest(payload)
    } catch (error) {
      return {
        ok: false,
        status: 0,
        statusText: 'NETWORK_ERROR',
        headers: {},
        dataType: 'text',
        data: error == null ? 'Backend request failed' : String(error),
      } satisfies BackendResponsePayload
    }
  })
}
