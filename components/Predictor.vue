<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  variant?: 'default' | 'spotlight'
  compact?: boolean
  showTitle?: boolean
}>(), {
  variant: 'default',
  compact: false,
  showTitle: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()
const { $api } = useNuxtApp()

const predictions = ref<string[]>([])
const isLoading = ref(false)
const insertPosition = ref(0)
let activeRequestId = 0
const rootClasses = computed(() => ({
  predictor: true,
  'predictor--spotlight': props.variant === 'spotlight',
  'predictor--compact': props.compact,
}))
const buttonVariant = computed(() => (props.variant === 'spotlight' ? 'text' : 'tonal'))
const buttonSize = computed(() => (props.compact ? 'x-small' : 'small'))
const progressSize = computed(() => (props.compact ? 18 : 24))
const iconSize = computed(() => (props.compact ? 16 : 18))

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
    :class="rootClasses"
    role="region"
    :aria-label="t('a11y.predictorList')"
    aria-live="polite"
    :aria-busy="isLoading"
  >
    <div
      v-if="props.showTitle"
      class="predictor-header d-flex align-center mb-2"
    >
      <VIcon
        :size="iconSize"
        class="mr-1"
        color="primary"
      >
        mdi-lightbulb-outline
      </VIcon>
      <span class="predictor-title text-caption text-medium-emphasis">{{ t('predictor.title') }}</span>
    </div>

    <div class="predictor-body">
      <div
        v-if="isLoading"
        class="predictor-loading"
      >
        <VProgressCircular
          indeterminate
          :size="progressSize"
          color="primary"
        />
      </div>

      <div
        v-else-if="predictions.length > 0"
        class="button-row predictor-row"
      >
        <VBtn
          v-for="(word, index) in predictions"
          :key="index"
          :variant="buttonVariant"
          color="primary"
          :size="buttonSize"
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
        class="predictor-empty text-caption text-medium-emphasis"
      >
        {{ t('predictor.noSuggestions') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.predictor {
  padding: 12px;
  background: var(--linka-surface, #f5f5f5);
  border-radius: 8px;
}

.predictor-header {
  gap: 4px;
}

.predictor-title {
  line-height: 1.2;
}

.predictor-body {
  min-height: 56px;
  display: flex;
  align-items: center;
}

.predictor-row {
  width: 100%;
}

.predictor-loading,
.predictor-empty {
  width: 100%;
  text-align: center;
  padding: 8px 0;
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

.predictor--spotlight {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
}

.predictor--spotlight .prediction-btn {
  background: rgba(255, 255, 255, 0.18) !important;
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.predictor--spotlight .prediction-btn:hover {
  background: rgba(255, 255, 255, 0.26) !important;
  border-color: rgba(255, 255, 255, 0.5);
}

.predictor--spotlight .predictor-title {
  color: rgba(255, 255, 255, 0.7);
}

.predictor--spotlight .prediction-badge {
  color: #141414;
}

.predictor--spotlight .predictor-empty {
  color: rgba(255, 255, 255, 0.6);
}

.predictor--compact {
  padding: 8px 10px;
  border-radius: 12px;
}

.predictor--compact .predictor-body {
  min-height: 40px;
}

.predictor--compact .predictor-loading,
.predictor--compact .predictor-empty {
  padding: 4px 0;
}

.predictor--compact .predictor-row {
  gap: 6px;
  padding: 0;
}

.predictor--compact .prediction-btn {
  min-height: 32px;
  padding-left: 26px;
  font-size: 13px;
}

.predictor--compact .prediction-badge {
  left: 5px;
  width: 16px;
  height: 16px;
  font-size: 9px;
}
</style>
