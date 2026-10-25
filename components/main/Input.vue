<script setup lang="ts">
import { syncTextareaPaste } from '~/composables/usePredictor'

const props = defineProps<{
  modelValue: string
  isPlaying: boolean
  showDownload: boolean
  showPredictor: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  say: [download: boolean]
  clear: []
  toggleSpotlight: []
}>()

const { t } = useI18n()
type TextareaRef = {
  focus?: () => void
  $el?: Element | null
}
type PredictorRef = {
  refresh: (text?: string) => Promise<void>
}
const textareaRef = ref<TextareaRef | null>(null)
const predictorRef = ref<PredictorRef | null>(null)

const focus = () => {
  const target = textareaRef.value
  if (!target) return
  if (typeof target.focus === 'function') {
    target.focus()
    return
  }
  const el = target.$el?.querySelector?.('textarea') as HTMLTextAreaElement | undefined
  el?.focus()
}

const refreshPredictions = (text?: string) => {
  void predictorRef.value?.refresh(text)
}

defineExpose({ focus, refreshPredictions })

const handleEnter = () => {
  if (!props.modelValue.trim()) return
  emit('say', false)
}

const handlePaste = (event: ClipboardEvent) => {
  syncTextareaPaste(
    event,
    () => props.modelValue,
    value => emit('update:modelValue', value),
    value => refreshPredictions(value),
  )
}
</script>

<template>
  <div class="main-input">
    <Predictor
      v-if="props.showPredictor"
      ref="predictorRef"
      :model-value="props.modelValue"
      class="mb-3"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <VTextarea
      ref="textareaRef"
      :model-value="props.modelValue"
      :placeholder="t('main.placeholder')"
      rows="4"
      auto-grow
      :aria-label="t('main.placeholder')"
      @update:model-value="emit('update:modelValue', $event)"
      @paste="handlePaste"
       @keydown.enter.exact.prevent="handleEnter"
       @keydown.ctrl.enter="emit('update:modelValue', props.modelValue + '\n')"
       @keydown.ctrl.b.stop.prevent="emit('toggleSpotlight')"
       @keydown.meta.b.stop.prevent="emit('toggleSpotlight')"
    >
      <template #append-inner>
        <VBtn
          icon
          size="small"
          variant="text"
          :aria-label="t('a11y.spotlightButton')"
          @click="emit('toggleSpotlight')"
        >
          <VIcon>mdi-fullscreen</VIcon>
        </VBtn>
      </template>
    </VTextarea>

    <div class="main-input-actions d-flex">
      <VBtn
        color="primary"
        size="large"
        :prepend-icon="props.isPlaying ? 'mdi-stop' : 'mdi-volume-high'"
        :aria-label="props.isPlaying ? t('a11y.stopButton') : t('a11y.playButton')"
        class="main-input-btn flex-grow-1"
        :disabled="!props.isPlaying && !props.modelValue.trim()"
        @click="emit('say', false)"
      >
        {{ props.isPlaying ? t('main.stop') : t('main.say') }}
      </VBtn>
      <VBtn
        v-if="props.showDownload"
        variant="outlined"
        size="large"
        icon
        class="main-input-btn"
        :aria-label="t('main.download')"
        :disabled="!props.modelValue.trim()"
        @click="emit('say', true)"
      >
        <VIcon>mdi-download</VIcon>
      </VBtn>
      <VBtn
        variant="outlined"
        size="large"
        icon
        class="main-input-btn"
        :aria-label="t('main.clear')"
        @click="emit('clear')"
      >
        <VIcon>mdi-delete</VIcon>
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.main-input :deep(.v-field) {
  border-radius: 12px;
  transition: box-shadow 0.2s ease;
}

.main-input :deep(.v-field:focus-within) {
  box-shadow: 0 0 0 3px rgba(25, 115, 119, 0.15);
}

.main-input-actions {
  align-items: stretch;
  gap: 8px;
  margin-top: 10px;
}

.main-input-btn {
  height: 48px;
  min-height: 48px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.main-input-btn.v-btn--icon {
  width: 48px;
  border-color: rgba(var(--v-theme-primary), 0.25);
  background: rgba(var(--v-theme-primary), 0.04);
}

.main-input-btn.v-btn--icon:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
