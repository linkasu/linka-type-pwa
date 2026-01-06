import { getApiClient } from './client'
import type { Voice, TTSRequest } from '~/types/api'

export const ttsApi = {
  async getVoices(): Promise<Voice[]> {
    const client = getApiClient()
    const response = await client.get<Voice[]>('/voices')
    return response.data
  },

  async synthesize(data: TTSRequest): Promise<Blob> {
    const client = getApiClient()
    const response = await client.post('/tts', data, {
      responseType: 'arraybuffer',
    })
    return new Blob([response.data], { type: 'audio/mp3' })
  },
}

