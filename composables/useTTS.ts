import { useSettingsStore } from '~/stores/settings'
import type { TelemetryOutcome } from '~/types/analytics'
import { countBucket, durationBucket } from './analytics/trackers'
import { loadBrowserVoices, playBrowserSpeech } from './tts/browserSpeech'
import { downloadAudioBlob, loadYandexVoiceOptions } from './tts/yandexHelpers'
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
  source?: Extract<TelemetryOutcome, { kind: 'speech_completed' }>['source']
  download?: boolean
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export const useTTS = () => {
  const settingsStore = useSettingsStore()
  const { api, analytics } = useAppServices()
  const isPlaying = ref(false)
  const voices = ref<SpeechSynthesisVoice[]>([])
  const yandexVoices = ref<Array<{ id: string; name: string }>>([])

  let currentOperation: { cancel: () => void } | null = null

  const loadVoices = () => {
    loadBrowserVoices(voices)
  }

  const loadYandexVoices = async () => {
    yandexVoices.value = await loadYandexVoiceOptions()
  }

  const stop = () => {
    currentOperation?.cancel()
  }

  const speak = (text: string, options: TTSOptions = {}): Promise<void> => {
    if (!text.trim()) return Promise.resolve()
    stop()
    const mode = settingsStore.yandex ? 'cloud' : 'local'
    const voice = settingsStore.yandexVoice || 'alena'
    const rate = settingsStore.rate

    return new Promise<void>((resolve) => {
      let terminal = false
      let startedAt: number | undefined
      let audio: HTMLAudioElement | null = null
      let audioUrl: string | null = null
      let utterance: SpeechSynthesisUtterance | null = null
      const active = () => !terminal && currentOperation === operation
      const finish = (result: 'completed' | 'failed' | 'cancelled', error?: Error) => {
        if (!active()) return
        terminal = true
        currentOperation = null
        isPlaying.value = false
        if (utterance && result === 'cancelled') speechSynthesis.cancel()
        if (audio) {
          audio.pause()
          audio.src = ''
        }
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        if (options.source) {
          analytics.track({
            kind: 'speech_completed', result, source: options.source, mode,
            count_bucket: countBucket(text.length),
            duration_bucket: durationBucket(startedAt === undefined ? 0 : performance.now() - startedAt),
            ...(result === 'failed' ? { failure_code: mode === 'cloud' ? 'request_failed' : 'engine_unavailable' } : {}),
          })
        }
        resolve()
        if (result === 'completed') options.onEnd?.()
        if (result === 'failed') options.onError?.(error ?? new Error('TTS error'))
      }
      const operation = { cancel: () => finish('cancelled') }
      currentOperation = operation
      const markStarted = () => {
        if (active() && startedAt === undefined) startedAt = performance.now()
      }

      const playCloud = async () => {
        try {
          isPlaying.value = true
          options.onStart?.()
          if (!active()) return
          const cacheKey = generateCacheKey(text, voice, rate)
          let blob = await getCachedAudio(cacheKey)
          if (!active()) return
          if (!blob) {
            blob = await api.tts.synthesize({ text, voice, speed: rate })
            if (!active()) return
            saveToCache(cacheKey, text, voice, blob).catch(() => {})
          }
          if (options.download) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            downloadAudioBlob(blob, `linka-${timestamp}.mp3`)
          }
          audioUrl = URL.createObjectURL(blob)
          audio = new Audio(audioUrl)
          audio.volume = settingsStore.volume
          audio.onplaying = markStarted
          audio.onended = () => finish('completed')
          audio.onerror = () => finish('failed', new Error('Audio playback error'))
          await audio.play()
          markStarted()
        } catch (error) {
          finish('failed', error instanceof Error ? error : new Error('TTS error'))
        }
      }

      if (mode === 'cloud') {
        void playCloud()
      } else {
        try {
          utterance = playBrowserSpeech({
            text,
            options: {
              onStart: () => {
                if (!active()) return
                markStarted()
                options.onStart?.()
              },
              onEnd: () => finish('completed'),
              onError: error => finish('failed', error),
            },
            settings: { volume: settingsStore.volume, rate, pitch: settingsStore.pitch, voiceUri: settingsStore.voiceUri },
            voices: voices.value,
            // The previous operation was stopped before this one was created.
            stopCurrent: () => {},
            setPlaying: playing => { if (active()) isPlaying.value = playing },
          })
        } catch (error) {
          finish('failed', error instanceof Error ? error : new Error('TTS error'))
        }
      }
    })
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
