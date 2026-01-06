interface UseMainKeyboardOptions {
  activeChat: Ref<number>
  onToggleSpotlight: () => void
}

export function useMainKeyboard(options: UseMainKeyboardOptions) {
  const { activeChat, onToggleSpotlight } = options

  const handleKeydown = (event: KeyboardEvent) => {
    const isCtrlOrMeta = event.ctrlKey || event.metaKey

    if (isCtrlOrMeta && event.key.toLowerCase() === 'b') {
      event.preventDefault()
      onToggleSpotlight()
      return
    }

    if (event.ctrlKey && event.key === 'ArrowUp') {
      event.preventDefault()
      activeChat.value = (activeChat.value + 2) % 3
    } else if (event.ctrlKey && event.key === 'ArrowDown') {
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

