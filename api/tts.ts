import { getApiClient } from './client'
import type { Voice, TTSRequest } from '~/types/api'

const NO_AUTH_REQUEST = { _skipAuth: true } as any

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
      const response = await client.post('/tts', data, {
        responseType: 'arraybuffer',
      })
      return new Blob([response.data], { type: 'audio/mp3' })
    } catch {
      const response = await client.post('https://tts.linka.su/tts', data, {
        ...NO_AUTH_REQUEST,
        responseType: 'arraybuffer',
      })
      return new Blob([response.data], { type: 'audio/mp3' })
    }
  },
}
