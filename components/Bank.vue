<script setup lang="ts">
import { useBankItems } from '~/composables/useBankItems'
import { useBankKeyboard } from '~/composables/useBankKeyboard'
import { useTTS } from '~/composables/useTTS'
import { useStatementsStore } from '~/stores/statements'
import { useSettingsStore } from '~/stores/settings'
import { preloadPhrases, generateCacheKey, isCached } from '~/utils/ttsCache'
import { ttsApi } from '~/api/tts'
import type { Category, Statement } from '~/types/api'

const emit = defineEmits<{
  paste: [text: string]
  speak: [text: string]
}>()

const { t } = useI18n()

const containerRef = ref<HTMLElement | null>(null)
const isPasteMode = ref(false)
const isReaderMode = ref(false)
const isTextEditorMode = ref(false)
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const editingItem = ref<Category | Statement | null>(null)

// Caching state
const isCaching = ref(false)
const cachingProgress = ref(0)
const cachingTotal = ref(0)
const cachingCategoryName = ref('')

const statementsStore = useStatementsStore()
const settingsStore = useSettingsStore()

const {
  selectedCategoryId,
  currentItems,
  isShowingCategories,
  addItem,
  deleteItem,
  updateItem,
  getRandomFromCategory,
  saveTextEditorChanges,
  isCategory,
} = useBankItems()

const handleItemSelect = (item: Category | Statement) => {
  if (isCategory(item)) {
    selectedCategoryId.value = item.id
  } else {
    if (isPasteMode.value) {
      emit('paste', item.text)
    } else {
      emit('speak', item.text)
    }
  }
}

const handleRandomStatement = () => {
  const random = getRandomFromCategory()
  if (random) {
    if (isPasteMode.value) {
      emit('paste', random.text)
    } else {
      emit('speak', random.text)
    }
  }
}

useBankKeyboard({
  selectedCategoryId,
  isPasteMode,
  currentItems,
  onItemSelect: handleItemSelect,
  onRandomStatement: handleRandomStatement,
  containerRef,
})

const handleAdd = async (payload: { text: string; aiUse?: boolean }) => {
  try {
    await addItem(payload.text, payload.aiUse)
  } catch (err) {
    console.error('Failed to add item:', err)
  }
}

const handleDelete = async (item: Category | Statement) => {
  try {
    await deleteItem(item)
  } catch (err) {
    console.error('Failed to delete item:', err)
  }
}

const handleEdit = (item: Category | Statement) => {
  editingItem.value = item
  showEditDialog.value = true
}

const handleEditSave = async (payload: { text: string; aiUse?: boolean }) => {
  if (!editingItem.value) return
  try {
    await updateItem(editingItem.value, payload.text, payload.aiUse)
    editingItem.value = null
  } catch (err) {
    console.error('Failed to edit item:', err)
  }
}

const handleTextEditorSave = async (statements: string[]) => {
  try {
    await saveTextEditorChanges(statements)
    isTextEditorMode.value = false
  } catch (err) {
    console.error('Failed to save text editor changes:', err)
  }
}

const handleCacheCategory = async (category: Category) => {
  if (!settingsStore.yandex) {
    // TTS caching only works with online TTS
    return
  }

  try {
    // Load statements for this category
    const statements = await statementsStore.fetchByCategory(category.id)
    if (statements.length === 0) return

    const voice = settingsStore.yandexVoice || 'alena'
    const phrases = statements.map(s => s.text)

    isCaching.value = true
    cachingCategoryName.value = category.label
    cachingProgress.value = 0
    cachingTotal.value = phrases.length

    const synthesize = async (text: string, voiceId: string): Promise<Blob> => {
      return await ttsApi.synthesize({
        text,
        voice: voiceId,
        speed: settingsStore.rate,
      })
    }

    await preloadPhrases(
      phrases,
      voice,
      synthesize,
      (current, total) => {
        cachingProgress.value = current
        cachingTotal.value = total
      }
    )
  } catch (err) {
    console.error('Failed to cache category:', err)
  } finally {
    isCaching.value = false
  }
}

const focus = () => {
  containerRef.value?.focus()
}

defineExpose({ focus })
</script>

<template>
  <div
    ref="containerRef"
    class="bank-container"
    role="region"
    :aria-label="isShowingCategories ? t('a11y.categoryList') : t('a11y.statementList')"
    tabindex="0"
  >
    <BankHeader
      :is-showing-categories="isShowingCategories"
      :is-paste-mode="isPasteMode"
      @back="selectedCategoryId = null"
      @toggle-paste-mode="isPasteMode = !isPasteMode"
      @open-reader="isReaderMode = true"
      @open-text-editor="isTextEditorMode = true"
      @random="handleRandomStatement"
      @add="showAddDialog = true"
    />

    <BankList
      :items="currentItems"
      :is-showing-categories="isShowingCategories"
      @select="handleItemSelect"
      @edit="handleEdit"
      @delete="handleDelete"
      @cache="handleCacheCategory"
    />

    <BankItemDialog
      v-model="showAddDialog"
      mode="add"
      :is-category="isShowingCategories"
      @save="handleAdd"
    />

    <BankItemDialog
      v-model="showEditDialog"
      mode="edit"
      :is-category="editingItem ? isCategory(editingItem) : true"
      :editing-item="editingItem"
      @save="handleEditSave"
    />

    <Reader
      v-if="isReaderMode && selectedCategoryId"
      :statements="currentItems as Statement[]"
      @close="isReaderMode = false"
    />

    <TextEditor
      v-if="isTextEditorMode && selectedCategoryId"
      :statements="currentItems as Statement[]"
      :category-id="selectedCategoryId"
      @close="isTextEditorMode = false"
      @save="handleTextEditorSave"
    />

    <!-- Caching Progress Dialog -->
    <VDialog
      :model-value="isCaching"
      persistent
      max-width="400"
    >
      <VCard class="pa-4">
        <VCardTitle class="text-h6">
          {{ t('bank.cachingTitle') }}
        </VCardTitle>
        <VCardText>
          <div class="text-body-2 mb-2">
            {{ cachingCategoryName }}
          </div>
          <VProgressLinear
            :model-value="cachingTotal > 0 ? (cachingProgress / cachingTotal) * 100 : 0"
            color="primary"
            height="8"
            rounded
          />
          <div class="text-caption text-center mt-2">
            {{ cachingProgress }} / {{ cachingTotal }}
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
