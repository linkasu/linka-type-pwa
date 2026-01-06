import { useSettingsStore } from '~/stores/settings'
import { useTTS } from '~/composables/useTTS'

const TYPE_SOUND_BASE64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi6Fzu3agTcIF2y///jIeSwGKoPU8tyJNwgZaLvt559NEA=='

export function useTypeSound() {
  const settingsStore = useSettingsStore()
  const { speakLastWord } = useTTS()

  let typeAudio: HTMLAudioElement | null = null

  const playTypeSound = () => {
    if (settingsStore.typeSound) {
      if (!typeAudio) {
        typeAudio = new Audio(TYPE_SOUND_BASE64)
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

