import { QWERTY_MAP } from '~/types'
import type { Category, Statement } from '~/types/api'

interface UseBankKeyboardOptions {
  selectedCategoryId: Ref<string | null>
  isPasteMode: Ref<boolean>
  currentItems: ComputedRef<(Category | Statement)[]>
  onItemSelect: (item: Category | Statement) => void
  onRandomStatement: () => void
  containerRef: Ref<HTMLElement | null>
}

export function useBankKeyboard(options: UseBankKeyboardOptions) {
  const {
    selectedCategoryId,
    isPasteMode,
    currentItems,
    onItemSelect,
    onRandomStatement,
    containerRef,
  } = options

  const handleKeydown = (event: KeyboardEvent) => {
    const container = containerRef.value
    const target = event.target as Node | null
    const activeElement = document.activeElement
    const isInside = container
      && ((target && container.contains(target)) || (activeElement && container.contains(activeElement)))
    if (!isInside) {
      return
    }

    if (event.key === 'Escape') {
      if (selectedCategoryId.value) {
        selectedCategoryId.value = null
      }
      return
    }

    if (event.key.toLowerCase() === 'v' && selectedCategoryId.value) {
      isPasteMode.value = !isPasteMode.value
      return
    }

    if (event.key.toLowerCase() === 'r' && selectedCategoryId.value) {
      onRandomStatement()
      return
    }

    const key = event.key.toUpperCase()
    const index = QWERTY_MAP.indexOf(key as typeof QWERTY_MAP[number])
    if (index !== -1 && index < currentItems.value.length) {
      onItemSelect(currentItems.value[index])
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
