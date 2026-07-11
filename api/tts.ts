import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getApiClient } from './client'
import type { Voice, TTSRequest } from '~/types/api'

const NO_AUTH_REQUEST = { _skipAuth: true } as unknown as AxiosRequestConfig
const TTS_BASE_URL = (import.meta.env.VITE_TTS_BASE_URL || 'https://tts.linka.su').replace(/\/$/, '')

const audioBlob = (response: AxiosResponse<ArrayBuffer>): Blob => {
  const contentType = String(response.headers['content-type'] || 'audio/mpeg')
  return new Blob([response.data], { type: contentType })
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
      const response = await client.post(`${TTS_BASE_URL}/tts`, data, {
        ...NO_AUTH_REQUEST,
        responseType: 'arraybuffer',
        timeout: 120000,
      })
      return audioBlob(response)
    } catch {
      const response = await client.post('/tts', data, {
        ...NO_AUTH_REQUEST,
        responseType: 'arraybuffer',
        timeout: 120000,
      })
      return audioBlob(response)
    }
  },
}
