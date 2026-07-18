import { preloadPhrases } from '~/utils/ttsCache'
import { ttsApi } from '~/api/tts'
import type { Category, Statement } from '~/types/api'

type SettingsStoreLike = {
  yandex: boolean
  yandexVoice?: string
  rate: number
}

type StatementsStoreLike = {
  fetchByCategory: (categoryId: string) => Promise<Statement[]>
}

type UseBankCachingOptions = {
  settingsStore: SettingsStoreLike
  statementsStore: StatementsStoreLike
  trackCategoryCacheStarted: (itemCount: number) => void
  trackCategoryCacheCompleted: (itemCount: number) => void
}

export const useBankCaching = (options: UseBankCachingOptions) => {
  const isCaching = ref(false)
  const cachingProgress = ref(0)
  const cachingTotal = ref(0)
  const cachingCategoryName = ref('')

  const cacheCategory = async (category: Category) => {
    if (!options.settingsStore.yandex) return

    try {
      const statements = await options.statementsStore.fetchByCategory(category.id)
      if (statements.length === 0) return

      const voice = options.settingsStore.yandexVoice || 'alena'
      const phrases = statements.map(statement => statement.text)

      options.trackCategoryCacheStarted(phrases.length)
      isCaching.value = true
      cachingCategoryName.value = category.label
      cachingProgress.value = 0
      cachingTotal.value = phrases.length

      await preloadPhrases(
        phrases,
        voice,
        async (text: string, voiceId: string) => {
          return ttsApi.synthesize({
            text,
            voice: voiceId,
            speed: options.settingsStore.rate,
          })
        },
        (current, total) => {
          cachingProgress.value = current
          cachingTotal.value = total
        },
      )

      options.trackCategoryCacheCompleted(phrases.length)
    } catch (err) {
      console.error('Failed to cache category:', err)
    } finally {
      isCaching.value = false
    }
  }

  return {
    isCaching,
    cachingProgress,
    cachingTotal,
    cachingCategoryName,
    cacheCategory,
  }
}
