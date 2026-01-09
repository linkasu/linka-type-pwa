interface UseMainKeyboardOptions {
  activeChat: Ref<number>
  onToggleSpotlight: () => void
  onFocusQuickes?: () => void
  onFocusBank?: () => void
}

export function useMainKeyboard(options: UseMainKeyboardOptions) {
  const {
    activeChat,
    onToggleSpotlight,
    onFocusQuickes,
    onFocusBank,
  } = options

  const handleKeydown = (event: KeyboardEvent) => {
    const isCtrlOrMeta = event.ctrlKey || event.metaKey

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
