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

  const addItem = async (text: string) => {
    if (!text.trim()) return

    if (isShowingCategories.value) {
      await categoriesStore.createCategory(text)
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

  const updateItem = async (item: Category | Statement, newText: string) => {
    if (!newText.trim()) return

    if ('label' in item) {
      await categoriesStore.updateCategoryLabel(item.id, newText)
    } else {
      await statementsStore.updateStatementText(item.id, newText)
    }
  }

  const getRandomFromCategory = () => {
    if (!selectedCategoryId.value) return null
    return statementsStore.getRandomFromCategory(selectedCategoryId.value)
  }

  const saveTextEditorChanges = async (statements: string[]) => {
    if (!selectedCategoryId.value) return

    const categoryId = selectedCategoryId.value
    const normalized = statements
      .map(text => text.trim())
      .filter(Boolean)
    const existing = statementsStore.getByCategoryId(categoryId)

    const existingTexts = existing.map(statement => statement.text)
    const hasChanges =
      normalized.length !== existingTexts.length ||
      normalized.some((text, index) => text !== existingTexts[index])

    if (!hasChanges) return

    const created: Statement[] = []

    try {
      for (const text of normalized) {
        const statement = await statementsStore.createStatement(categoryId, text)
        created.push(statement)
      }
    } catch (err) {
      await Promise.all(
        created.map(statement =>
          statementsStore.deleteStatement(statement.id).catch(() => null),
        ),
      )
      throw err
    }

    await Promise.all(
      existing.map(statement =>
        statementsStore.deleteStatement(statement.id).catch(() => null),
      ),
    )

    await statementsStore.fetchByCategory(categoryId, true)
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
