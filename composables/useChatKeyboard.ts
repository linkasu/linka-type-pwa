interface UseChatKeyboardOptions {
  onFocusInput?: () => void
  onToggleRecording?: () => void
  onNewChat?: () => void
  onStopRecording?: () => void
}

export function useChatKeyboard(options: UseChatKeyboardOptions) {
  const {
    onFocusInput,
    onToggleRecording,
    onNewChat,
    onStopRecording,
  } = options

  const handleKeydown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    const activeElement = document.activeElement as HTMLElement | null
    const isEditable = (element: HTMLElement | null) => {
      if (!element) return false
      if (element.isContentEditable) return true
      const tag = element.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }
    const isCtrlOrMeta = event.ctrlKey || event.metaKey
    const editable = isEditable(target) || isEditable(activeElement)

    if (
      event.key.toLowerCase() === 'i'
      && !event.ctrlKey
      && !event.metaKey
      && !event.altKey
      && !editable
    ) {
      event.preventDefault()
      event.stopImmediatePropagation()
      onFocusInput?.()
      return
    }

    if (isCtrlOrMeta && event.code === 'KeyN') {
      event.preventDefault()
      onNewChat?.()
      return
    }

    if (event.code === 'KeyR' && !event.ctrlKey && !event.metaKey && !event.altKey && !editable) {
      event.preventDefault()
      onToggleRecording?.()
      return
    }

    if (event.key === 'Escape' && !editable) {
      onStopRecording?.()
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
