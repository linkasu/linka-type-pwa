<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { useSettingsStore } from '~/stores/settings'

const props = defineProps<{
  modelValue: boolean
  text: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:text': [value: string]
  say: []
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
const { lgAndUp } = useDisplay()
const showSpotlightPredictor = computed(() => settingsStore.showSpotlightPredictor && lgAndUp.value)

const spotlightTextarea = ref<HTMLTextAreaElement | null>(null)

watch(() => props.modelValue, (open) => {
  if (open) {
    nextTick(() => {
      spotlightTextarea.value?.focus()
    })
  }
})

const isPredictionShortcut = (event: KeyboardEvent) => {
  const usesAlt = event.altKey && !event.ctrlKey && !event.metaKey
  const usesMeta = event.metaKey && !event.ctrlKey && !event.altKey
  if (!usesAlt && !usesMeta) return false
  const keyNum = Number.parseInt(event.key, 10)
  if (!Number.isNaN(keyNum)) return keyNum >= 1 && keyNum <= 5
  const codeMatch = /^(Digit|Numpad)(\d)$/.exec(event.code)
  if (!codeMatch) return false
  const codeNum = Number.parseInt(codeMatch[2], 10)
  return codeNum >= 1 && codeNum <= 5
}

const handleKeydown = (event: KeyboardEvent) => {
  const isCtrlOrMeta = event.ctrlKey || event.metaKey
  if (!isPredictionShortcut(event)) {
    event.stopPropagation()
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    emit('update:modelValue', false)
    return
  }

  if (isCtrlOrMeta && event.key.toLowerCase() === 'b') {
    event.preventDefault()
    emit('update:modelValue', false)
    return
  }

  if (event.key === 'Enter' && isCtrlOrMeta) {
    event.preventDefault()
    emit('say')
  }
}
</script>

<template>
  <VDialog
    :model-value="props.modelValue"
    fullscreen
    persistent
    content-class="spotlight-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="spotlight-container">
      <div class="spotlight-stage">
        <textarea
          ref="spotlightTextarea"
          :value="props.text"
          class="spotlight-textarea"
          :placeholder="t('main.placeholder')"
          @input="emit('update:text', ($event.target as HTMLTextAreaElement).value)"
          @keydown="handleKeydown"
        />
      </div>

      <div
        class="spotlight-footer"
        :class="{ 'spotlight-footer--solo': !showSpotlightPredictor }"
      >
        <div
          v-if="showSpotlightPredictor"
          class="spotlight-predictor"
        >
          <Predictor
            :model-value="props.text"
            variant="spotlight"
            compact
            :show-title="false"
            @update:model-value="emit('update:text', $event)"
          />
        </div>
        <div class="spotlight-hint">
          Esc - {{ t('reader.close') }} | Ctrl+Enter - {{ t('main.say') }} | Ctrl+B - {{ t('reader.close') }}
        </div>
      </div>
    </div>
  </VDialog>
</template>

<style scoped>
.spotlight-container {
  position: fixed;
  inset: 0;
  padding: 16px;
  gap: 12px;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(70% 60% at 50% 0%, rgba(251, 204, 48, 0.08), rgba(0, 0, 0, 0) 70%),
    radial-gradient(60% 50% at 10% 0%, rgba(25, 115, 119, 0.12), rgba(0, 0, 0, 0) 65%),
    #000;
}

.spotlight-stage {
  flex: 1;
  min-height: 0;
  display: flex;
}

.spotlight-textarea {
  flex: 1;
  resize: none;
  width: 100%;
  height: 100%;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.65);
  font-size: clamp(32px, 8vh, 96px);
  line-height: 1.15em;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-radius: 24px;
  padding: 28px;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;
}

.spotlight-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.spotlight-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  text-align: right;
  padding: 8px 0;
}

.spotlight-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

.spotlight-footer--solo {
  grid-template-columns: 1fr;
  justify-items: center;
}

.spotlight-footer--solo .spotlight-hint {
  text-align: center;
}

.spotlight-predictor {
  width: 100%;
  max-width: 720px;
}
</style>

<style>
.spotlight-dialog {
  background-color: #000 !important;
}

.spotlight-dialog .v-overlay__content {
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  margin: 0 !important;
}
</style>
