import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getApiClient } from './client'
import type { RequestConfig } from './transport/types'
import type { Voice, TTSRequest } from '~/types/api'

type TtsRequestConfig = AxiosRequestConfig & Pick<RequestConfig, '_skipAuth' | '_skipServerRetry'>

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

const audioBlob = (response: AxiosResponse<ArrayBuffer>): Blob => {
  const contentType = String(response.headers['content-type'] || 'audio/mpeg')
  return new Blob([response.data], { type: contentType })
}

const shouldUseDirectTts = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false

  const { status, response } = error as { status?: unknown; response?: { status?: unknown } }
  return (response?.status ?? status) === 404 || (response?.status ?? status) === 501
}

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
  },
}
