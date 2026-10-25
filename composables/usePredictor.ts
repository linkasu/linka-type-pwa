import { ref, watch } from 'vue'
import { useAnalytics } from '~/composables/useAnalytics'
import { useAppServices } from '~/composables/useAppServices'

export interface UsePredictorOptions {
  modelValue: () => string
  onUpdateModelValue: (value: string) => void
  debounceMs?: number
}

export function syncTextareaPaste(
  event: ClipboardEvent,
  getCurrentValue: () => string,
  onSyncValue: (value: string) => void,
  onRefresh: (value: string) => void,
) {
  const rawTarget = event.target as { tagName?: string, value?: string } | null
  const target = rawTarget && rawTarget.tagName === 'TEXTAREA' && typeof rawTarget.value === 'string'
    ? rawTarget
    : ((event.currentTarget as { querySelector?: (s: string) => { value?: string } | null } | null)?.querySelector?.('textarea') ?? null)

  setTimeout(() => {
    const nextValue = typeof target?.value === 'string' ? target.value : getCurrentValue()
    const needsValueSync = nextValue !== getCurrentValue()
    if (needsValueSync) {
      onSyncValue(nextValue)
    }
    onRefresh(nextValue)
  }, 0)
}

export function usePredictor(options: UsePredictorOptions) {
  const debounceMs = options.debounceMs ?? 300
  const { api } = useAppServices()
  const { trackPredicatorUse } = useAnalytics()

  const predictions = ref<string[]>([])
  const isLoading = ref(false)
  const insertPosition = ref(0)

  let activeRequestId = 0
  let fetchTimeout: ReturnType<typeof setTimeout> | null = null
  let lastObservedText = options.modelValue()
  let immediateSyncedText: string | null = null

  const clearScheduledFetch = () => {
    if (fetchTimeout) {
      clearTimeout(fetchTimeout)
      fetchTimeout = null
    }
  }

  const resetPredictions = () => {
    activeRequestId++
    predictions.value = []
    insertPosition.value = 0
    isLoading.value = false
  }

  const fetchPredictions = async (text: string) => {
    clearScheduledFetch()
    if (!text.trim()) {
      resetPredictions()
      return
    }

    const requestId = ++activeRequestId
    predictions.value = []
    insertPosition.value = 0
    isLoading.value = true

    try {
      const data = await api.predictor.complete(text, { lang: 'ru', limit: 5 })
      if (requestId !== activeRequestId) return
      predictions.value = data.text || []
      insertPosition.value = Number.isFinite(data.pos) ? data.pos : 0
    } catch (err) {
      console.error('Predictor error:', err)
      if (requestId === activeRequestId) {
        predictions.value = []
        insertPosition.value = 0
      }
    } finally {
      if (requestId === activeRequestId) {
        isLoading.value = false
      }
    }
  }

  const refresh = async (text = options.modelValue()) => {
    immediateSyncedText = text !== lastObservedText ? text : null
    await fetchPredictions(text)
  }

  watch(options.modelValue, (text) => {
    lastObservedText = text
    if (immediateSyncedText !== null && text === immediateSyncedText) {
      immediateSyncedText = null
      return
    }
    immediateSyncedText = null
    clearScheduledFetch()
    resetPredictions()

    if (!text.trim()) {
      return
    }

    fetchTimeout = setTimeout(() => {
      fetchTimeout = null
      void fetchPredictions(text)
    }, debounceMs)
  }, { immediate: true })

  const buildPredictionText = (prediction: string) => {
    const text = options.modelValue()
    const pos = insertPosition.value
    let base = text

    if (pos < 0) {
      base = text.slice(0, pos)
    }

    if (pos === 1) {
      base += ' '
    }

    return base + prediction
  }

  const selectPrediction = (prediction: string, index?: number) => {
    trackPredicatorUse(index ?? predictions.value.indexOf(prediction))
    const nextText = buildPredictionText(prediction)
    resetPredictions()
    options.onUpdateModelValue(nextText)
  }

  const dispose = () => {
    immediateSyncedText = null
    clearScheduledFetch()
    resetPredictions()
  }

  return {
    predictions,
    isLoading,
    insertPosition,
    fetchPredictions,
    refresh,
    buildPredictionText,
    selectPrediction,
    dispose,
  }
}
