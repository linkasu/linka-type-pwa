import { ttsApi } from '~/api/tts'
import { useSettingsStore } from '~/stores/settings'
import {
  generateCacheKey,
  getCachedAudio,
  saveToCache,
  getCacheInfo,
  clearCache,
  getCacheEnabled,
  setCacheEnabled,
  getCacheSizeLimitMb,
  setCacheSizeLimitMb,
  type TtsCacheInfo,
} from '~/utils/ttsCache'

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

  const loadYandexVoices = async () => {
    try {
      const data = await ttsApi.getVoices()
      yandexVoices.value = data.map(v => ({ id: v.id, name: v.name }))
    } catch (err) {
      console.error('Failed to load TTS voices:', err)
    }
  }

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

  const speakYandex = async (text: string, options: TTSOptions = {}) => {
    stop()

    let audioUrl: string | null = null

    try {
      isPlaying.value = true
      options.onStart?.()

      const voice = settingsStore.yandexVoice || 'alena'
      const cacheKey = generateCacheKey(text, voice)

      // Try to get from cache first
      let blob = await getCachedAudio(cacheKey)

      if (!blob) {
        // Not in cache, fetch from API
        blob = await ttsApi.synthesize({
          text,
          voice,
          speed: settingsStore.rate,
        })

        // Save to cache in background (don't await)
        saveToCache(cacheKey, text, voice, blob).catch(() => {
          // Ignore cache save errors
        })
      }

      if (options.download) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        downloadAudio(blob, `linka-${timestamp}.mp3`)
      }

      audioUrl = URL.createObjectURL(blob)
      currentAudio = new Audio(audioUrl)
      currentAudio.volume = settingsStore.volume

      // Store audioUrl in closure for cleanup
      const urlToRevoke = audioUrl

      currentAudio.onended = () => {
        isPlaying.value = false
        URL.revokeObjectURL(urlToRevoke)
        options.onEnd?.()
      }

      currentAudio.onerror = () => {
        isPlaying.value = false
        URL.revokeObjectURL(urlToRevoke)
        options.onError?.(new Error('Audio playback error'))
      }

      await currentAudio.play()
    } catch (err) {
      isPlaying.value = false
      // Cleanup audio URL on error to prevent memory leak
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      options.onError?.(err instanceof Error ? err : new Error('TTS error'))
    }
  }

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

  const speak = async (text: string, options: TTSOptions = {}) => {
    if (!text.trim()) return

    if (settingsStore.yandex) {
      await speakYandex(text, options)
    } else {
      speakBrowser(text, options)
    }
  }

  const speakLastWord = (text: string) => {
    const words = text.trim().split(/\s+/)
    const lastWord = words[words.length - 1]
    if (lastWord) {
      speak(lastWord)
    }
  }

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
    // TTS cache functions
    getCacheInfo,
    clearCache,
    getCacheEnabled,
    setCacheEnabled,
    getCacheSizeLimitMb,
    setCacheSizeLimitMb,
  }
}
