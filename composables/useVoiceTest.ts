import { useSettingsStore } from '~/stores/settings'
import type { TTSVoice } from '~/api/tts'

const isSpeechSynthesisAvailable = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

export function useVoiceTest() {
  const { t, locale } = useI18n()
  const { $api } = useNuxtApp()
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
        const blob = await $api.tts.synthesize({
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
  const { $api } = useNuxtApp()

  const ttsVoices = ref<TTSVoice[]>([])
  const browserVoices = ref<SpeechSynthesisVoice[]>([])
  const isLoadingVoices = ref(false)

  const loadTtsVoices = async () => {
    isLoadingVoices.value = true
    try {
      ttsVoices.value = await $api.tts.getVoices()
    } catch (err) {
      console.error('Failed to load TTS voices:', err)
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
      title: `${v.name} (${v.engine === 'yandex' ? 'Яндекс' : 'Sber'}, ${v.gender === 'F' ? 'Ж' : 'М'})`,
      value: v.id,
      subtitle: v.lang,
    }))
  })

  const russianTtsVoices = computed(() => {
    return ttsVoiceItems.value.filter(v => {
      const voice = ttsVoices.value.find(tv => tv.id === v.value)
      return voice?.lang_code === 'ru-RU'
    })
  })

  return {
    ttsVoices,
    browserVoices,
    isLoadingVoices,
    loadTtsVoices,
    loadBrowserVoices,
    ttsVoiceItems,
    russianTtsVoices,
  }
}
