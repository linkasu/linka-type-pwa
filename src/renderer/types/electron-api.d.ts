interface DesktopUpdatesApi {
  check: () => Promise<Record<string, unknown>>
  download: () => Promise<Record<string, unknown>>
  install: () => Promise<void>
  onStatus: (callback: (payload: Record<string, unknown>) => void) => () => void
}

interface DesktopAppApi {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<string>
}

type DesktopMediaAccessStatus = 'not-determined' | 'granted' | 'denied' | 'restricted' | 'unknown'

interface DesktopMediaAccessResult {
  granted: boolean
  status: DesktopMediaAccessStatus
  needsSystemSettings: boolean
}

interface DesktopMediaApi {
  ensureMicrophoneAccess: () => Promise<DesktopMediaAccessResult>
}

type DesktopBackendFormDataEntry =
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

type DesktopBackendBodyPayload =
  | { kind: 'json'; value: unknown }
  | { kind: 'text'; value: string }
  | { kind: 'binary'; base64: string; contentType?: string }
  | { kind: 'form-data'; entries: DesktopBackendFormDataEntry[] }

interface DesktopBackendRequestPayload {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: DesktopBackendBodyPayload | null
  responseType?: 'json' | 'text' | 'arraybuffer'
}

interface DesktopBackendResponsePayload {
  ok: boolean
  status: number
  statusText: string
  headers: Record<string, string>
  dataType: 'json' | 'text' | 'base64'
  data: unknown
}

interface DesktopBackendApi {
  request: (payload: DesktopBackendRequestPayload) => Promise<DesktopBackendResponsePayload>
}

declare global {
  interface Window {
    desktop?: {
      app: DesktopAppApi
      media: DesktopMediaApi
      updates: DesktopUpdatesApi
      backend: DesktopBackendApi
    }
  }
}

export {}
