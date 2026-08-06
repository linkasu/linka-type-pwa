<script setup lang="ts">
import type { Statement } from '~/types/api'

const props = defineProps<{
  statements: Statement[]
  categoryId: string
}>()

const emit = defineEmits<{
  close: []
  save: [statements: string[]]
}>()

const { t } = useI18n()

const textContent = ref('')

onMounted(() => {
  textContent.value = props.statements
    .map(s => s.text)
    .join('\n')
})

const handleSave = () => {
  const lines = textContent.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  emit('save', lines)
}

const lineCount = computed(() => {
  const lines = textContent.value.split('\n').filter(line => line.trim().length > 0)
  return lines.length
})
</script>

<template>
  <VDialog
    :model-value="true"
    fullscreen
    @update:model-value="emit('close')"
  >
    <VCard class="editor-card">
      <VToolbar
        color="primary"
        dark
      >
        <VBtn
          icon
          :aria-label="t('reader.close')"
          @click="emit('close')"
        >
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle>{{ t('textEditor.title') }}</VToolbarTitle>
        <VSpacer />
        <VBtn
          variant="text"
          @click="handleSave"
        >
          {{ t('actions.save') }}
        </VBtn>
      </VToolbar>

      <VCardText class="editor-card-content pa-0">
        <div class="editor-container">
          <div class="editor-hint pa-4 bg-surface-variant">
            <VIcon
              start
              size="small"
            >
              mdi-information-outline
            </VIcon>
            <span class="text-body-2">
              {{ t('textEditor.hint') }}
            </span>
            <VSpacer />
            <span class="text-caption text-medium-emphasis">
              {{ t('textEditor.lineCount') }}: {{ lineCount }}
            </span>
          </div>

          <VTextarea
            v-model="textContent"
            :placeholder="t('textEditor.placeholder')"
            variant="plain"
            rows="1"
            class="editor-textarea"
            hide-details
          />
        </div>
      </VCardText>

      <VCardActions class="justify-end pa-4">
        <VBtn
          variant="text"
          @click="emit('close')"
        >
          {{ t('actions.cancel') }}
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          @click="handleSave"
        >
          {{ t('actions.save') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.editor-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.editor-textarea {
  flex: 1;
  min-height: 0;
  padding: 24px;
  font-family: 'Roboto Mono', monospace;
  font-size: 1rem;
  line-height: 1.6;
}

.editor-textarea :deep(textarea) {
  height: 100%;
  overflow-y: auto;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.editor-textarea :deep(.v-input__control),
.editor-textarea :deep(.v-field),
.editor-textarea :deep(.v-field__field) { height: 100%; }

.editor-card {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}

.editor-card-content { flex: 1; min-height: 0; }
.editor-card :deep(.v-card-actions) { flex-shrink: 0; }
</style>
