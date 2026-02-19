import type { Category } from '~/types/api'

export interface CategoriesCollection {
  categories: Map<string, Category>
}

export const normalizeCategory = (category: Category): Category => ({
  ...category,
  aiUse: category.aiUse ?? false,
})

export const getSortedCategories = (state: CategoriesCollection): Category[] => {
  const categories = Array.from(state.categories.values())
  return categories.sort((a, b) => {
    if (a.default && !b.default) return -1
    if (!a.default && b.default) return 1
    return a.created - b.created
  })
}

export const setCategoryInState = (
  state: CategoriesCollection,
  category: Category,
) => {
  const normalized = normalizeCategory(category)
  state.categories.set(normalized.id, normalized)
  return normalized
}

export const removeCategoryFromState = (state: CategoriesCollection, id: string) => {
  state.categories.delete(id)
}

export const setCategoriesFromList = (
  state: CategoriesCollection,
  categories: Category[],
) => {
  state.categories.clear()
  for (const category of categories) {
    setCategoryInState(state, category)
  }
}

export const replaceCategoryIdInState = (
  state: CategoriesCollection,
  tempId: string,
  category: Category,
) => {
  state.categories.delete(tempId)
  setCategoryInState(state, category)
}
