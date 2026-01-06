<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()
const config = useRuntimeConfig()

const predictions = ref<string[]>([])
const isLoading = ref(false)
const insertPosition = ref(0)

// Debounced fetch
let fetchTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.modelValue, async (text) => {
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
  }

  if (!text.trim()) {
    predictions.value = []
    return
  }

  fetchTimeout = setTimeout(async () => {
    await fetchPredictions(text)
  }, 300)
})

const fetchPredictions = async (text: string) => {
  isLoading.value = true
  
  try {
    const apiKey = config.public.predictorApiKey
    if (!apiKey) {
      predictions.value = []
      return
    }

    const response = await fetch(
      `https://predictor.yandex.net/api/v1/predict.json/complete?key=${apiKey}&q=${encodeURIComponent(text)}&lang=ru&limit=5`
    )
    
    if (!response.ok) {
      throw new Error('Predictor API error')
    }

    const data = await response.json()
    predictions.value = data.text || []
    insertPosition.value = data.pos || text.length
  } catch (err) {
    console.error('Predictor error:', err)
    predictions.value = []
  } finally {
    isLoading.value = false
  }
}

const selectPrediction = (prediction: string) => {
  const text = props.modelValue
  const newText = text.substring(0, insertPosition.value) + prediction
  emit('update:modelValue', newText)
  predictions.value = []
}

// Keyboard shortcuts 1-5
const handleKeydown = (event: KeyboardEvent) => {
  if (predictions.value.length === 0) return
  
  const num = parseInt(event.key)
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
    v-if="predictions.length > 0 || isLoading"
    class="predictor"
    role="region"
    :aria-label="t('a11y.predictorList')"
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
      v-else
      class="button-row"
    >
      <VBtn
        v-for="(word, index) in predictions"
        :key="index"
        variant="tonal"
        color="primary"
        size="small"
        class="prediction-btn"
        :aria-keyshortcuts="`${index + 1}`"
        @click="selectPrediction(word)"
      >
        <span class="prediction-badge">{{ index + 1 }}</span>
        {{ word }}
      </VBtn>
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

