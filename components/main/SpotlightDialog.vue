<script setup lang="ts">
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

const spotlightTextarea = ref<HTMLTextAreaElement | null>(null)

watch(() => props.modelValue, (open) => {
  if (open) {
    nextTick(() => {
      spotlightTextarea.value?.focus()
    })
  }
})

const handleKeydown = (event: KeyboardEvent) => {
  const isCtrlOrMeta = event.ctrlKey || event.metaKey
  event.stopPropagation()

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
      <textarea
        ref="spotlightTextarea"
        :value="props.text"
        class="spotlight-textarea"
        :placeholder="t('main.placeholder')"
        @input="emit('update:text', ($event.target as HTMLTextAreaElement).value)"
        @keydown="handleKeydown"
      />
      <div class="spotlight-hint">
        Esc - {{ t('reader.close') }} | Ctrl+Enter - {{ t('main.say') }} | Ctrl+B - {{ t('reader.close') }}
      </div>
    </div>
  </VDialog>
</template>

<style scoped>
.spotlight-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  flex-direction: column;
}

.spotlight-textarea {
  flex: 1;
  resize: none;
  width: 100%;
  height: 100%;
  color: #fff;
  background-color: #000;
  font-size: 10vh;
  line-height: 1.2em;
  border: 3px solid #fff;
  padding: 20px;
  box-sizing: border-box;
  outline: none;
  font-family: inherit;
}

.spotlight-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.spotlight-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  text-align: center;
  padding: 10px;
  background-color: #000;
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

