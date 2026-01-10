interface UseChatKeyboardOptions {
  onToggleRecording?: () => void
  onNewChat?: () => void
  onStopRecording?: () => void
  onSelectSuggestion?: (index: number) => void
  onStopSpeech?: () => void
  onClear?: () => void
}

export function useChatKeyboard(options: UseChatKeyboardOptions) {
  const {
    onToggleRecording,
    onNewChat,
    onStopRecording,
    onSelectSuggestion,
    onStopSpeech,
    onClear,
  } = options

  const handleKeydown = (event: KeyboardEvent) => {
    const isCtrlOrMeta = event.ctrlKey || event.metaKey
    const isAltOrMeta = event.altKey || event.metaKey

    // Ctrl/Cmd + N - new chat
    if (isCtrlOrMeta && event.code === 'KeyN') {
      event.preventDefault()
      onNewChat?.()
      return
    }

    // Ctrl/Cmd + R - toggle recording
    if (isCtrlOrMeta && event.code === 'KeyR') {
      event.preventDefault()
      onToggleRecording?.()
      return
    }

    // Escape - stop recording and speech
    if (event.key === 'Escape') {
      event.preventDefault()
      onStopRecording?.()
      onStopSpeech?.()
      return
    }

    // Alt/Cmd + 1-5 - select suggestion
    if (isAltOrMeta && !event.ctrlKey) {
      const digit = parseInt(event.key, 10)
      if (digit >= 1 && digit <= 5) {
        event.preventDefault()
        onSelectSuggestion?.(digit - 1)
        return
      }
    }

    // Ctrl/Cmd + Backspace - clear input
    if (isCtrlOrMeta && event.key === 'Backspace') {
      event.preventDefault()
      onClear?.()
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    handleKeydown,
  }
}
