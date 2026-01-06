import { QWERTY_MAP } from '~/types'
import type { Category, Statement } from '~/types/api'

interface UseBankKeyboardOptions {
  selectedCategoryId: Ref<string | null>
  isPasteMode: Ref<boolean>
  currentItems: ComputedRef<(Category | Statement)[]>
  onItemSelect: (item: Category | Statement) => void
  onRandomStatement: () => void
}

export function useBankKeyboard(options: UseBankKeyboardOptions) {
  const {
    selectedCategoryId,
    isPasteMode,
    currentItems,
    onItemSelect,
    onRandomStatement,
  } = options

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
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

