import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getApiClient } from './client'
import type { RequestConfig } from './transport/types'
import type { Voice, TTSRequest } from '~/types/api'

type TtsRequestConfig = AxiosRequestConfig & Pick<RequestConfig, '_skipAuth' | '_skipServerRetry'>
type InstallationToken = { token: string; expires_at: string | number }

const NO_AUTH_REQUEST: TtsRequestConfig = {
  _skipAuth: true,
  _skipServerRetry: true,
}
const TTS_REQUEST: TtsRequestConfig = {
  _skipServerRetry: true,
  responseType: 'arraybuffer',
  timeout: 120000,
}
const TTS_BASE_URL = (import.meta.env.VITE_TTS_BASE_URL || 'https://tts.linka.su').replace(/\/$/, '')
const INSTALLATION_TOKEN_KEY = 'linka.tts.installation-token.v1'
const TOKEN_REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000

const audioBlob = (response: AxiosResponse<ArrayBuffer>): Blob => {
  const contentType = String(response.headers['content-type'] || 'audio/mpeg')
  return new Blob([response.data], { type: contentType })
}

const errorStatus = (error: unknown): unknown => {
  if (typeof error !== 'object' || error === null) return false

  const { status, response } = error as { status?: unknown; response?: { status?: unknown } }
  return response?.status ?? status
}

const shouldUseDirectTts = (error: unknown): boolean => {
  const status = errorStatus(error)
  return status === 404 || status === 501
}

const tokenStorage = (): Storage | null => {
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage
  } catch {
    return null
  }
}

const readInstallationToken = (): InstallationToken | null => {
  const storage = tokenStorage()
  if (!storage) return null

  try {
    const value = JSON.parse(storage.getItem(INSTALLATION_TOKEN_KEY) || 'null') as InstallationToken | null
    const expiresAt = value && new Date(value.expires_at).getTime()
    return value?.token && Number.isFinite(expiresAt) && expiresAt > Date.now() + TOKEN_REFRESH_WINDOW_MS
      ? value
      : null
  } catch {
    return null
  }
}

const storeInstallationToken = (token: InstallationToken): void => {
  const storage = tokenStorage()
  if (!storage) return

  try {
    storage.setItem(INSTALLATION_TOKEN_KEY, JSON.stringify(token))
  } catch {
    // Storage failures must not prevent a TTS request.
  }
}

const isInstallationTokenFeatureEnabled = (): boolean =>
  import.meta.env.VITE_TTS_INSTALLATION_TOKENS_ENABLED === 'true'

const anonymousRequestConfig = (token: string, idempotencyKey: string): TtsRequestConfig => ({
  ...NO_AUTH_REQUEST,
  ...TTS_REQUEST,
  headers: {
    'X-TTS-Installation-Token': token,
    'Idempotency-Key': idempotencyKey,
  },
})

export const ttsApi = {
  async getVoices(): Promise<Voice[]> {
    const client = getApiClient()

    try {
      const response = await client.get<Voice[]>('/voices', NO_AUTH_REQUEST)
      return response.data
    } catch {
      const response = await client.get<Voice[]>('https://tts.linka.su/voices', NO_AUTH_REQUEST)
      return response.data
    }
  },

  async synthesize(data: TTSRequest): Promise<Blob> {
    const client = getApiClient()

    const synthesizeLegacy = async (): Promise<Blob> => {
      try {
        const response = await client.post('/tts', data, TTS_REQUEST)
        return audioBlob(response)
      } catch (error) {
        if (!shouldUseDirectTts(error)) throw error

        const response = await client.post(`${TTS_BASE_URL}/tts`, data, {
          ...NO_AUTH_REQUEST,
          ...TTS_REQUEST,
        })
        return audioBlob(response)
      }
    }

    if (!isInstallationTokenFeatureEnabled() || !tokenStorage()) return synthesizeLegacy()

    const bootstrap = async (): Promise<InstallationToken> => {
      const response = await client.post<InstallationToken>('/tts/installations', {}, NO_AUTH_REQUEST)
      storeInstallationToken(response.data)
      return response.data
    }
    const idempotencyKey = crypto.randomUUID()
    let token: InstallationToken

    try {
      token = readInstallationToken() || await bootstrap()
    } catch (error) {
      if (shouldUseDirectTts(error)) return synthesizeLegacy()
      throw error
    }

    try {
      const response = await client.post('/tts/anonymous', data, anonymousRequestConfig(token.token, idempotencyKey))
      return audioBlob(response)
    } catch (error) {
      if (shouldUseDirectTts(error)) return synthesizeLegacy()
      if (errorStatus(error) !== 401) throw error

      try {
        token = await bootstrap()
        const response = await client.post('/tts/anonymous', data, anonymousRequestConfig(token.token, idempotencyKey))
        return audioBlob(response)
      } catch (retryError) {
        if (shouldUseDirectTts(retryError)) return synthesizeLegacy()
        throw retryError
      }
    }
  },
}
