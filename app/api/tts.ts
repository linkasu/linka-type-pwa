import axios from 'axios'

const TTS_BASE_URL = 'https://tts.linka.su'

export interface TTSVoice {
  id: string
  name: string
  lang_code: string
  lang: string
  gender: 'M' | 'F'
  role: string[] | null
  engine: 'yandex' | 'sber'
}

export interface TTSSynthesizeRequest {
  text: string
  voice?: string
  speed?: number
}

export const ttsApi = {
  async getVoices(): Promise<TTSVoice[]> {
    const response = await axios.get<TTSVoice[]>(`${TTS_BASE_URL}/voices`)
    return response.data
  },

  async synthesize(data: TTSSynthesizeRequest): Promise<Blob> {
    const response = await axios.post(`${TTS_BASE_URL}/tts`, {
      text: data.text,
      voice: data.voice || 'alena',
      speed: data.speed || 1.0,
    }, {
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return new Blob([response.data], { type: 'audio/mpeg' })
  },
}

