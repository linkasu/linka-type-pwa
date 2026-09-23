import { useCategoriesStore } from '~/stores/categories'
import { useStatementsStore } from '~/stores/statements'
import type { Category, Statement } from '~/types/api'

export function useBankItems() {
  const categoriesStore = useCategoriesStore()
  const statementsStore = useStatementsStore()

  const selectedCategoryId = ref<string | null>(null)

  const currentItems = computed(() => {
    if (selectedCategoryId.value) {
      return statementsStore.getByCategoryId(selectedCategoryId.value)
    }
    return categoriesStore.sortedCategories
  })

  const isShowingCategories = computed(() => !selectedCategoryId.value)

  watch(selectedCategoryId, async (categoryId) => {
    if (categoryId) {
      await statementsStore.fetchByCategory(categoryId)
    }
  })

  const addItem = async (text: string, aiUse?: boolean) => {
    if (!text.trim()) return

    if (isShowingCategories.value) {
      await categoriesStore.createCategory(text, aiUse ?? false)
    } else if (selectedCategoryId.value) {
      await statementsStore.createStatement(selectedCategoryId.value, text)
    }
  }

  const deleteItem = async (item: Category | Statement) => {
    if ('label' in item) {
      await categoriesStore.deleteCategory(item.id)
    } else {
      await statementsStore.deleteStatement(item.id)
    }
  }

  const updateItem = async (item: Category | Statement, newText: string, aiUse?: boolean) => {
    if (!newText.trim()) return

    if ('label' in item) {
      await categoriesStore.updateCategoryLabel(item.id, newText, aiUse)
    } else {
      await statementsStore.updateStatementText(item.id, newText)
    }
  }

  const getRandomFromCategory = () => {
    if (!selectedCategoryId.value) return null
    return statementsStore.getRandomFromCategory(selectedCategoryId.value)
  }

  const saveTextEditorChanges = async (text: string, confirmationToken?: string) => {
    if (!selectedCategoryId.value) return null
    return statementsStore.replaceStatements(selectedCategoryId.value, text, confirmationToken)
  }

  const getItemLabel = (item: Category | Statement): string => {
    return 'label' in item ? item.label : item.text
  }

  const isCategory = (item: Category | Statement): item is Category => {
    return 'label' in item
  }

  return {
    selectedCategoryId,
    currentItems,
    isShowingCategories,
    addItem,
    deleteItem,
    updateItem,
    getRandomFromCategory,
    saveTextEditorChanges,
    getItemLabel,
    isCategory,
  }
}
