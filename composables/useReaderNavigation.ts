import type { Statement } from '~/types/api'

interface UseReaderNavigationOptions {
  statements: Ref<Statement[]>
  onClose: () => void
}

export function useReaderNavigation(options: UseReaderNavigationOptions) {
  const { statements, onClose } = options
  const { speak, stop, isPlaying } = useTTS()

  const currentIndex = ref(0)

  const currentStatement = computed(() =>
    statements.value[currentIndex.value],
  )

  const canGoPrev = computed(() => currentIndex.value > 0)
  const canGoNext = computed(() => currentIndex.value < statements.value.length - 1)

  const prev = () => {
    if (canGoPrev.value) {
      stop()
      currentIndex.value--
    }
  }

  const next = () => {
    if (canGoNext.value) {
      stop()
      currentIndex.value++
    }
  }

  const togglePlay = () => {
    if (isPlaying.value) {
      stop()
    } else if (currentStatement.value) {
      speak(currentStatement.value.text, {
        onEnd: () => {
          if (canGoNext.value) {
            setTimeout(() => next(), 500)
          }
        },
      })
    }
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.repeat) return

    const target = event.target as HTMLElement | null
    const isInteractive = target?.matches('button, a, input, textarea, select, [contenteditable="true"]')
    if (isInteractive && event.key !== 'Escape') return

    switch (event.key) {
      case 'Escape':
        event.stopPropagation()
        onClose()
        break
      case ' ':
        event.preventDefault()
        event.stopPropagation()
        togglePlay()
        break
      case 'ArrowLeft':
        event.preventDefault()
        event.stopPropagation()
        prev()
        break
      case 'ArrowRight':
        event.preventDefault()
        event.stopPropagation()
        next()
        break
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    stop()
  })

  return {
    currentIndex,
    currentStatement,
    canGoPrev,
    canGoNext,
    isPlaying,
    prev,
    next,
    togglePlay,
  }
}
