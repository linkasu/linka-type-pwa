interface UseChatKeyboardOptions {
  onToggleRecording?: () => void
  onNewChat?: () => void
  onStopRecording?: () => void
  onSelectSuggestion?: (index: number) => void
  onStopSpeech?: () => void
  onClear?: () => void
  onStartRecording?: () => void
  onStopRecordingAndSend?: () => void
}

export function useChatKeyboard(options: UseChatKeyboardOptions) {
  const {
    onToggleRecording,
    onNewChat,
    onStopRecording,
    onSelectSuggestion,
    onStopSpeech,
    onClear,
    onStartRecording,
    onStopRecordingAndSend,
  } = options

  let spaceHeld = false

  const isInputFocused = () => {
    const active = document.activeElement
    if (!active) return false
    const tag = active.tagName.toLowerCase()
    return tag === 'input' || tag === 'textarea' || (active as HTMLElement).isContentEditable
  }

  const handleKeydown = (event: KeyboardEvent) => {
    const isCtrlOrMeta = event.ctrlKey || event.metaKey
    const isAltOrMeta = event.altKey || event.metaKey

    // Ctrl/Cmd + N - new chat
    if (isCtrlOrMeta && event.code === 'KeyN') {
      event.preventDefault()
      onNewChat?.()
      return
    }

    // Meta + L - toggle recording
    if (event.metaKey && event.code === 'KeyL') {
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

    // Space - push-to-talk (only when not in input)
    if (event.code === 'Space' && !isInputFocused() && !spaceHeld) {
      event.preventDefault()
      spaceHeld = true
      onStartRecording?.()
      return
    }
  }

  const handleKeyup = (event: KeyboardEvent) => {
    // Space release - stop recording and send
    if (event.code === 'Space' && spaceHeld) {
      event.preventDefault()
      spaceHeld = false
      onStopRecordingAndSend?.()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyup)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keyup', handleKeyup)
  })

  return {
    handleKeydown,
    handleKeyup,
  }
}
