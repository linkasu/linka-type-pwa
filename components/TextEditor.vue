<script setup lang="ts">
import type { Statement, StatementReplaceSummary } from '~/types/api'
import { normalizeStatementText } from '~/utils/statementText'

const props = defineProps<{
  statements: Statement[]
  saving: boolean
  confirmation: StatementReplaceSummary | null
  error: string | null
}>()

const emit = defineEmits<{
  close: []
  save: [text: string]
  confirm: []
  cancelConfirmation: []
}>()

const { t } = useI18n()

const textContent = ref('')

onMounted(() => {
  textContent.value = props.statements
    .map(s => s.text)
    .join('\n')
})

const handleSave = () => {
  emit('save', textContent.value)
}

const normalized = computed(() => normalizeStatementText(textContent.value))
const lineCount = computed(() => normalized.value.texts.length)
const duplicateCount = computed(() => normalized.value.duplicates)
const confirmationParams = computed(() => props.confirmation ? { ...props.confirmation } : {})

const close = () => {
  if (!props.saving) emit('close')
}
</script>

<template>
  <VDialog
    :model-value="true"
    fullscreen
    :persistent="saving"
    @update:model-value="close"
  >
    <VCard class="editor-card">
      <VToolbar
        color="primary"
        dark
      >
        <VBtn
          icon
          :disabled="saving"
          :aria-label="t('reader.close')"
          @click="close"
        >
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle>{{ t('textEditor.title') }}</VToolbarTitle>
        <VSpacer />
        <VBtn
          variant="text"
          :loading="saving"
          :disabled="saving || Boolean(confirmation)"
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
              <template v-if="duplicateCount > 0">
                · {{ t('textEditor.duplicates', { count: duplicateCount }) }}
              </template>
            </span>
          </div>

          <VTextarea
            v-model="textContent"
            :placeholder="t('textEditor.placeholder')"
            variant="plain"
            rows="1"
            class="editor-textarea"
            hide-details
            :disabled="saving || Boolean(confirmation)"
          />
        </div>
      </VCardText>

      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        class="mx-4 mt-4"
      >
        {{ error }}
      </VAlert>

      <VAlert
        v-if="confirmation"
        type="warning"
        variant="tonal"
        class="mx-4 mt-4"
      >
        <div class="font-weight-medium">{{ t('textEditor.confirmTitle') }}</div>
        <div class="mt-1">
          {{ t('textEditor.summary', confirmationParams) }}
        </div>
      </VAlert>

      <VCardActions class="justify-end pa-4">
        <VBtn
          variant="text"
          :disabled="saving"
          @click="confirmation ? emit('cancelConfirmation') : close()"
        >
          {{ confirmation ? t('textEditor.keepEditing') : t('actions.cancel') }}
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          :loading="saving"
          @click="confirmation ? emit('confirm') : handleSave()"
        >
          {{ confirmation ? t('textEditor.confirmReplace') : t('actions.save') }}
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
