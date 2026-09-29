import { useCategoriesStore } from '~/stores/categories'
import { useQuickesStore } from '~/stores/quickes'
import { useSettingsStore } from '~/stores/settings'
import { getErrorMessage } from '~/utils/error'
import { getMainLoadState, type MainLoadState } from '~/utils/mainLoadState'

export const useMainDataLoading = () => {
  const settingsStore = useSettingsStore()
  const categoriesStore = useCategoriesStore()
  const quickesStore = useQuickesStore()
  const loadState = ref<MainLoadState>(null)

  const loadMainData = async () => {
    loadState.value = null
    const results = await Promise.allSettled([
      settingsStore.initialize(),
      categoriesStore.fetchCategories(),
      quickesStore.fetchQuickes(),
    ])

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(['Failed to load settings:', 'Failed to load categories:', 'Failed to load quick phrases:'][index], getErrorMessage(result.reason, 'Unknown error'))
      }
    })

    const categoriesFailed = results[1].status === 'rejected' || Boolean(categoriesStore.error)
    const otherFailed = results[0].status === 'rejected'
      || results[2].status === 'rejected'
      || Boolean(quickesStore.error)
    loadState.value = getMainLoadState({
      categoriesFailed,
      hasCategories: categoriesStore.categories.size > 0,
      hasQuickes: quickesStore.quickes.length > 0,
      otherFailed,
    })
  }

  return { loadMainData, loadState }
}
