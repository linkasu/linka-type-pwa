import { useSettingsStore } from '~/stores/settings'
import { useTTS } from '~/composables/useTTS'

export function useTypeSound() {
  const settingsStore = useSettingsStore()
  const { speakLastWord } = useTTS()

  let typeAudio: HTMLAudioElement | null = null

  const playTypeSound = () => {
    if (settingsStore.typeSound) {
      if (!typeAudio) {
        typeAudio = new Audio('/sounds/type.wav')
        typeAudio.volume = 0.3
      }
      typeAudio.currentTime = 0
      typeAudio.play().catch(() => {})
    }
  }

  const handleTextInput = (newValue: string, oldValue: string) => {
    if (settingsStore.typeSound) {
      playTypeSound()
    }

    if (settingsStore.speakLastWord && newValue.endsWith(' ') && !oldValue.endsWith(' ')) {
      const words = newValue.trim().split(/\s+/)
      const lastWord = words[words.length - 1]
      if (lastWord) {
        speakLastWord(lastWord)
      }
    }
  }

  return {
    playTypeSound,
    handleTextInput,
  }
}
