import type { Ref } from 'vue'

type PlaybackOptions = {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

type BrowserSpeechSettings = {
  volume: number
  rate: number
  pitch: number
  voiceUri?: string
}

export const loadBrowserVoices = (voices: Ref<SpeechSynthesisVoice[]>) => {
  if (!('speechSynthesis' in window)) return

  voices.value = speechSynthesis.getVoices()
  if (voices.value.length === 0) {
    speechSynthesis.addEventListener('voiceschanged', () => {
      voices.value = speechSynthesis.getVoices()
    })
  }
}

export const playBrowserSpeech = (params: {
  text: string
  options?: PlaybackOptions
  settings: BrowserSpeechSettings
  voices: SpeechSynthesisVoice[]
  stopCurrent: () => void
  setPlaying: (playing: boolean) => void
}): SpeechSynthesisUtterance | null => {
  const {
    text,
    options = {},
    settings,
    voices,
    stopCurrent,
    setPlaying,
  } = params

  if (!('speechSynthesis' in window)) {
    options.onError?.(new Error('Speech Synthesis not supported'))
    return null
  }

  stopCurrent()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ru-RU'
  utterance.volume = settings.volume
  utterance.rate = settings.rate
  utterance.pitch = settings.pitch

  if (settings.voiceUri) {
    const voice = voices.find(v => v.voiceURI === settings.voiceUri)
    if (voice) {
      utterance.voice = voice
    }
  }

  utterance.onstart = () => {
    setPlaying(true)
    options.onStart?.()
  }

  utterance.onend = () => {
    setPlaying(false)
    options.onEnd?.()
  }

  utterance.onerror = (event) => {
    setPlaying(false)
    options.onError?.(new Error(`Speech error: ${event.error}`))
  }

  speechSynthesis.speak(utterance)
  return utterance
}
