<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()
const { $api } = useNuxtApp()

const predictions = ref<string[]>([])
const isLoading = ref(false)
const insertPosition = ref(0)
let activeRequestId = 0

// Debounced fetch
let fetchTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.modelValue, async (text) => {
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
  }

  if (!text.trim()) {
    activeRequestId++
    predictions.value = []
    isLoading.value = false
    return
  }

  fetchTimeout = setTimeout(async () => {
    await fetchPredictions(text)
  }, 300)
})

const fetchPredictions = async (text: string) => {
  const requestId = ++activeRequestId
  isLoading.value = true
  
  try {
    const data = await $api.predictor.complete(text, { lang: 'ru', limit: 5 })
    if (requestId !== activeRequestId) return
    predictions.value = data.text || []
    insertPosition.value = Number.isFinite(data.pos) ? data.pos : 0
  } catch (err) {
    console.error('Predictor error:', err)
    if (requestId === activeRequestId) {
      predictions.value = []
    }
  } finally {
    if (requestId === activeRequestId) {
      isLoading.value = false
    }
  }
}

const buildPredictionText = (prediction: string) => {
  const text = props.modelValue
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

const selectPrediction = (prediction: string) => {
  emit('update:modelValue', buildPredictionText(prediction))
  predictions.value = []
}

// Keyboard shortcuts Alt/Cmd+1-5
const getShortcutNumber = (event: KeyboardEvent) => {
  const keyNum = Number.parseInt(event.key, 10)
  if (!Number.isNaN(keyNum)) return keyNum
  const codeMatch = /^(Digit|Numpad)(\d)$/.exec(event.code)
  return codeMatch ? Number.parseInt(codeMatch[2], 10) : NaN
}

const handleKeydown = (event: KeyboardEvent) => {
  if (predictions.value.length === 0) return

  const usesAlt = event.altKey && !event.ctrlKey && !event.metaKey
  const usesMeta = event.metaKey && !event.ctrlKey && !event.altKey
  if (!usesAlt && !usesMeta) return

  const num = getShortcutNumber(event)
  if (num >= 1 && num <= 5 && num <= predictions.value.length) {
    event.preventDefault()
    selectPrediction(predictions.value[num - 1])
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    class="predictor"
    role="region"
    :aria-label="t('a11y.predictorList')"
    aria-live="polite"
    :aria-busy="isLoading"
  >
    <div class="d-flex align-center mb-2">
      <VIcon
        size="small"
        class="mr-1"
        color="primary"
      >
        mdi-lightbulb-outline
      </VIcon>
      <span class="text-caption text-medium-emphasis">{{ t('predictor.title') }}</span>
    </div>

    <div
      v-if="isLoading"
      class="text-center pa-2"
    >
      <VProgressCircular
        indeterminate
        size="24"
        color="primary"
      />
    </div>

    <div
      v-else-if="predictions.length > 0"
      class="button-row"
    >
      <VBtn
        v-for="(word, index) in predictions"
        :key="index"
        variant="tonal"
        color="primary"
        size="small"
        class="prediction-btn"
        :aria-keyshortcuts="`Alt+${index + 1} Meta+${index + 1}`"
        @click="selectPrediction(word)"
      >
        <span class="prediction-badge">{{ index + 1 }}</span>
        {{ word }}
      </VBtn>
    </div>

    <div
      v-else
      class="text-caption text-medium-emphasis pa-2"
    >
      {{ t('predictor.noSuggestions') }}
    </div>
  </div>
</template>

<style scoped>
.predictor {
  padding: 12px;
  background: var(--linka-surface, #f5f5f5);
  border-radius: 8px;
}

.prediction-btn {
  position: relative;
  padding-left: 32px;
  text-transform: none;
}

.prediction-badge {
  position: absolute;
  left: 6px;
  width: 20px;
  height: 20px;
  background: var(--linka-accent, #fbcc30);
  color: var(--linka-text, #212121);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}
</style>
