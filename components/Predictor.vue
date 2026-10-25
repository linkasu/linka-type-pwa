<script setup lang="ts">
import { usePredictor } from '~/composables/usePredictor'

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

const {
  predictions,
  isLoading,
  refresh,
  selectPrediction,
  dispose,
} = usePredictor({
  modelValue: () => props.modelValue,
  onUpdateModelValue: value => emit('update:modelValue', value),
})

defineExpose({ refresh })

const rootClasses = computed(() => ({
  predictor: true,
  'predictor--spotlight': props.variant === 'spotlight',
  'predictor--compact': props.compact,
}))
const buttonVariant = computed(() => (props.variant === 'spotlight' ? 'text' : 'tonal'))
const buttonSize = computed(() => (props.compact ? 'x-small' : 'small'))
const progressSize = computed(() => (props.compact ? 18 : 24))
const iconSize = computed(() => (props.compact ? 16 : 18))

// Keyboard shortcuts Alt+1-5
const getShortcutNumber = (event: KeyboardEvent) => {
  const keyNum = Number.parseInt(event.key, 10)
  if (!Number.isNaN(keyNum)) return keyNum
  const codeMatch = /^(Digit|Numpad)(\d)$/.exec(event.code)
  return codeMatch ? Number.parseInt(codeMatch[2], 10) : NaN
}

const handleKeydown = (event: KeyboardEvent) => {
  if (predictions.value.length === 0) return

  if (!event.altKey || event.ctrlKey || event.metaKey) return

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
  dispose()
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
      class="predictor-header d-flex align-center"
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
          :aria-keyshortcuts="`Alt+${index + 1}`"
          @click="selectPrediction(word)"
        >
          <span class="prediction-badge">{{ index + 1 }}</span>
          {{ word }}
        </VBtn>
      </div>

      <div
        v-else-if="props.modelValue.trim()"
        class="predictor-empty text-caption text-medium-emphasis"
      >
        {{ t('predictor.noSuggestions') }}
      </div>
    </div>
  </div>
</template>

<style scoped src="../assets/styles/components/predictor.scss"></style>
