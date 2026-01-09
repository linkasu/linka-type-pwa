interface UseMainKeyboardOptions {
  activeChat: Ref<number>
  onToggleSpotlight: () => void
  onFocusInput?: () => void
  onFocusQuickes?: () => void
  onFocusBank?: () => void
}

export function useMainKeyboard(options: UseMainKeyboardOptions) {
  const {
    activeChat,
    onToggleSpotlight,
    onFocusInput,
    onFocusQuickes,
    onFocusBank,
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

    if (
      event.key.toLowerCase() === 'i'
      && !event.ctrlKey
      && !event.metaKey
      && !event.altKey
      && !isEditable(target)
      && !isEditable(activeElement)
    ) {
      event.preventDefault()
      event.stopImmediatePropagation()
      onFocusInput?.()
      return
    }

    if (isCtrlOrMeta && event.code === 'KeyB') {
      event.preventDefault()
      onToggleSpotlight()
      return
    }

    if (event.ctrlKey && event.code === 'Digit0') {
      event.preventDefault()
      onFocusQuickes?.()
      return
    }

    if (event.ctrlKey && event.code === 'Semicolon') {
      event.preventDefault()
      onFocusBank?.()
      return
    }

    if (isCtrlOrMeta && event.key === 'ArrowUp') {
      event.preventDefault()
      activeChat.value = (activeChat.value + 2) % 3
    } else if (isCtrlOrMeta && event.key === 'ArrowDown') {
      event.preventDefault()
      activeChat.value = (activeChat.value + 1) % 3
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
