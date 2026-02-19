import { useSettingsStore } from '~/stores/settings'
import type { Voice } from '~/types/api'

const isSpeechSynthesisAvailable = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

type BackendVoice = Voice & {
  lang_code?: string
}

const FALLBACK_TTS_VOICES: Voice[] = [
  { id: 'alena', name: 'Alena', lang: 'ru-RU', gender: 'female', engine: 'yandex' },
  { id: 'jane', name: 'Jane', lang: 'ru-RU', gender: 'female', engine: 'sber' },
]

const normalizeVoice = (voice: BackendVoice): Voice => {
  const lang = voice.lang_code || voice.lang || 'ru-RU'
  const normalizedGender = String(voice.gender || '').toLowerCase()
  const gender = normalizedGender === 'male' || normalizedGender === 'm' ? 'male' : 'female'
  const engine = voice.engine === 'sber' || voice.engine === 'browser' ? voice.engine : 'yandex'

  return {
    id: voice.id,
    name: voice.name || voice.id,
    lang,
    gender,
    engine,
  }
}

const isRussianVoice = (voice: Voice) => voice.lang.toLowerCase().startsWith('ru')

export function useVoiceTest() {
  const { t, locale } = useI18n()
  const { api } = useAppServices()
  const settingsStore = useSettingsStore()

  const isTestingVoice = ref(false)
  const speakWithWebSpeech = (text: string, voiceUri?: string) => {
    if (!isSpeechSynthesisAvailable()) {
      console.warn('Speech Synthesis not supported')
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale.value === 'ru' ? 'ru-RU' : 'en-US'
    utterance.volume = settingsStore.volume
    utterance.rate = settingsStore.rate
    utterance.pitch = settingsStore.pitch

    if (voiceUri) {
      const voices = speechSynthesis.getVoices()
      const selectedVoice = voices.find(v => v.voiceURI === voiceUri)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }

    speechSynthesis.speak(utterance)
  }

  const testVoice = async (yandexVoice: string, browserVoice: string) => {
    const testText = t('settings.voiceSettings.testText') || 'Привет! Это тест голоса.'

    if (settingsStore.yandex) {
      isTestingVoice.value = true
      try {
        const blob = await api.tts.synthesize({
          text: testText,
          voice: yandexVoice,
          speed: settingsStore.rate,
        })
        const audio = new Audio(URL.createObjectURL(blob))
        audio.volume = settingsStore.volume
        audio.play()
      } catch (err) {
        console.error('TTS error:', err)
        speakWithWebSpeech(testText, browserVoice)
      } finally {
        isTestingVoice.value = false
      }
    } else {
      speakWithWebSpeech(testText, browserVoice)
    }
  }

  return {
    isTestingVoice,
    testVoice,
  }
}

export function useVoiceLoader() {
  const { api } = useAppServices()

  const ttsVoices = ref<Voice[]>([])
  const browserVoices = ref<SpeechSynthesisVoice[]>([])
  const isLoadingVoices = ref(false)
  const isUsingFallbackVoices = ref(false)

  const loadTtsVoices = async () => {
    isLoadingVoices.value = true
    try {
      const loaded = (await api.tts.getVoices()) as BackendVoice[]
      const normalized = loaded
        .map(normalizeVoice)
        .filter((voice) => Boolean(voice.id))

      if (normalized.length > 0) {
        ttsVoices.value = normalized
        isUsingFallbackVoices.value = false
      } else {
        ttsVoices.value = [...FALLBACK_TTS_VOICES]
        isUsingFallbackVoices.value = true
      }
    } catch (err) {
      console.error('Failed to load TTS voices:', err)
      ttsVoices.value = [...FALLBACK_TTS_VOICES]
      isUsingFallbackVoices.value = true
    } finally {
      isLoadingVoices.value = false
    }
  }

  const loadBrowserVoices = () => {
    if (!isSpeechSynthesisAvailable()) {
      browserVoices.value = []
      return
    }

    browserVoices.value = speechSynthesis.getVoices().filter(v =>
      v.lang.startsWith('ru') || v.lang.startsWith('en'),
    )
  }

  const ttsVoiceItems = computed(() => {
    return ttsVoices.value.map(v => ({
      title: `${v.name} (${v.engine === 'yandex' ? 'Яндекс' : 'Sber'}, ${v.gender === 'female' ? 'Ж' : 'М'})`,
      value: v.id,
      subtitle: v.lang,
    }))
  })

  const russianTtsVoices = computed(() => {
    const russian = ttsVoices.value.filter(isRussianVoice)
    const source = russian.length ? russian : ttsVoices.value
    return source.map(v => ({
      title: `${v.name} (${v.engine === 'yandex' ? 'Яндекс' : 'Sber'}, ${v.gender === 'female' ? 'Ж' : 'М'})`,
      value: v.id,
      subtitle: v.lang,
    }))
  })

  return {
    ttsVoices,
    browserVoices,
    isLoadingVoices,
    isUsingFallbackVoices,
    loadTtsVoices,
    loadBrowserVoices,
    ttsVoiceItems,
    russianTtsVoices,
  }
}
