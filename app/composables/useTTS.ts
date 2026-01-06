import { ttsApi } from '~/api/tts'
import { useSettingsStore } from '~/stores/settings'

export interface TTSOptions {
  download?: boolean
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export const useTTS = () => {
  const settingsStore = useSettingsStore()
  const isPlaying = ref(false)
  const voices = ref<SpeechSynthesisVoice[]>([])
  const yandexVoices = ref<Array<{ id: string; name: string }>>([])
  
  let currentUtterance: SpeechSynthesisUtterance | null = null
  let currentAudio: HTMLAudioElement | null = null

  // Load browser voices
  const loadVoices = () => {
    if ('speechSynthesis' in window) {
      voices.value = speechSynthesis.getVoices()
      if (voices.value.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          voices.value = speechSynthesis.getVoices()
        })
      }
    }
  }

  // Load Yandex voices
  const loadYandexVoices = async () => {
    try {
      const data = await ttsApi.getVoices()
      yandexVoices.value = data.map(v => ({ id: v.id, name: v.name }))
    } catch (err) {
      console.error('Failed to load Yandex voices:', err)
    }
  }

  // Stop any current speech
  const stop = () => {
    if (currentUtterance && 'speechSynthesis' in window) {
      speechSynthesis.cancel()
      currentUtterance = null
    }
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
      currentAudio = null
    }
    isPlaying.value = false
  }

  // Download audio file
  const downloadAudio = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Speak using Yandex TTS
  const speakYandex = async (text: string, options: TTSOptions = {}) => {
    stop()
    
    try {
      isPlaying.value = true
      options.onStart?.()

      const blob = await ttsApi.synthesize({
        text,
        voice: settingsStore.yandexVoice || 'alena',
        speed: settingsStore.rate,
      })

      if (options.download) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        downloadAudio(blob, `linka-${timestamp}.mp3`)
      }

      const audioUrl = URL.createObjectURL(blob)
      currentAudio = new Audio(audioUrl)
      currentAudio.volume = settingsStore.volume

      currentAudio.onended = () => {
        isPlaying.value = false
        URL.revokeObjectURL(audioUrl)
        options.onEnd?.()
      }

      currentAudio.onerror = (err) => {
        isPlaying.value = false
        URL.revokeObjectURL(audioUrl)
        options.onError?.(new Error('Audio playback error'))
      }

      await currentAudio.play()
    } catch (err) {
      isPlaying.value = false
      options.onError?.(err instanceof Error ? err : new Error('TTS error'))
    }
  }

  // Speak using Web Speech API
  const speakBrowser = (text: string, options: TTSOptions = {}) => {
    if (!('speechSynthesis' in window)) {
      options.onError?.(new Error('Speech Synthesis not supported'))
      return
    }

    stop()

    currentUtterance = new SpeechSynthesisUtterance(text)
    currentUtterance.lang = 'ru-RU'
    currentUtterance.volume = settingsStore.volume
    currentUtterance.rate = settingsStore.rate
    currentUtterance.pitch = settingsStore.pitch

    if (settingsStore.voiceUri) {
      const voice = voices.value.find(v => v.voiceURI === settingsStore.voiceUri)
      if (voice) {
        currentUtterance.voice = voice
      }
    }

    currentUtterance.onstart = () => {
      isPlaying.value = true
      options.onStart?.()
    }

    currentUtterance.onend = () => {
      isPlaying.value = false
      options.onEnd?.()
    }

    currentUtterance.onerror = (event) => {
      isPlaying.value = false
      options.onError?.(new Error(`Speech error: ${event.error}`))
    }

    speechSynthesis.speak(currentUtterance)
  }

  // Main speak function
  const speak = async (text: string, options: TTSOptions = {}) => {
    if (!text.trim()) return

    if (settingsStore.yandex) {
      await speakYandex(text, options)
    } else {
      speakBrowser(text, options)
    }
  }

  // Speak last word
  const speakLastWord = (text: string) => {
    const words = text.trim().split(/\s+/)
    const lastWord = words[words.length - 1]
    if (lastWord) {
      speak(lastWord)
    }
  }

  // Initialize
  onMounted(() => {
    loadVoices()
    loadYandexVoices()
  })

  return {
    isPlaying: readonly(isPlaying),
    voices: readonly(voices),
    yandexVoices: readonly(yandexVoices),
    speak,
    stop,
    speakLastWord,
    loadVoices,
    loadYandexVoices,
  }
}

