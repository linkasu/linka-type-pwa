import type { InternalAxiosRequestConfig } from 'axios'

export interface RequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
  _skipAuth?: boolean
}

export type DesktopBackendBodyPayload =
  | { kind: 'json'; value: unknown }
  | { kind: 'text'; value: string }
  | { kind: 'binary'; base64: string; contentType?: string }
  | {
    kind: 'form-data'
    entries: Array<
      | { kind: 'text'; name: string; value: string }
      | {
        kind: 'file'
        name: string
        filename?: string
        contentType?: string
        base64: string
      }
    >
  }

export interface DesktopBackendRequestPayload {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: DesktopBackendBodyPayload | null
  responseType?: 'json' | 'text' | 'arraybuffer'
}

export interface DesktopBackendResponsePayload {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  dataType: 'json' | 'text' | 'base64'
  data: unknown
}
