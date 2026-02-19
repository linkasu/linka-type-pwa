<script setup lang="ts">
import { useBankItems } from '~/composables/useBankItems'
import { useBankKeyboard } from '~/composables/useBankKeyboard'
import { useBankCaching } from '~/composables/bank/useBankCaching'
import { useStatementsStore } from '~/stores/statements'
import { useSettingsStore } from '~/stores/settings'
import { useAnalytics } from '~/composables/useAnalytics'
import BankHeader from '~/components/bank/BankHeader.vue'
import BankCachingDialog from '~/components/bank/BankCachingDialog.vue'
import BankList from '~/components/bank/BankList.vue'
import BankItemDialog from '~/components/bank/BankItemDialog.vue'
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

const statementsStore = useStatementsStore()
const settingsStore = useSettingsStore()
const {
  trackBankCategorySelect,
  trackBankStatementSelect,
  trackCategoryCacheStarted,
  trackCategoryCacheCompleted,
} = useAnalytics()

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
const { isCaching, cachingProgress, cachingTotal, cachingCategoryName, cacheCategory } = useBankCaching({
  settingsStore,
  statementsStore,
  trackCategoryCacheStarted,
  trackCategoryCacheCompleted,
})

const handleItemSelect = (item: Category | Statement) => {
  if (isCategory(item)) {
    trackBankCategorySelect(item.id)
    selectedCategoryId.value = item.id
  } else {
    trackBankStatementSelect(item.id, isPasteMode.value)
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

const focus = () => containerRef.value?.focus()

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
      @cache="cacheCategory"
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

    <BankCachingDialog
      :is-caching="isCaching"
      :caching-progress="cachingProgress"
      :caching-total="cachingTotal"
      :caching-category-name="cachingCategoryName"
    />
  </div>
</template>
