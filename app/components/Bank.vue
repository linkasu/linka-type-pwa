<script setup lang="ts">
import { useCategoriesStore } from '~/stores/categories'
import { useStatementsStore } from '~/stores/statements'
import { QWERTY_MAP } from '~/types'
import type { Category, Statement } from '~/types/api'

const emit = defineEmits<{
  paste: [text: string]
  speak: [text: string]
}>()

const { t } = useI18n()
const categoriesStore = useCategoriesStore()
const statementsStore = useStatementsStore()

const selectedCategoryId = ref<string | null>(null)
const isPasteMode = ref(false)
const isReaderMode = ref(false)
const isTextEditorMode = ref(false)
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const newItemText = ref('')
const editItemText = ref('')
const editingItem = ref<Category | Statement | null>(null)

// Current view - categories or statements
const currentItems = computed(() => {
  if (selectedCategoryId.value) {
    return statementsStore.getByCategoryId(selectedCategoryId.value)
  }
  return categoriesStore.sortedCategories
})

const isShowingCategories = computed(() => !selectedCategoryId.value)

// Load statements when category selected
watch(selectedCategoryId, async (categoryId) => {
  if (categoryId) {
    await statementsStore.fetchByCategory(categoryId)
  }
})

// Handle keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return
  }

  // Escape - go back
  if (event.key === 'Escape') {
    if (selectedCategoryId.value) {
      selectedCategoryId.value = null
    }
    return
  }

  // V - toggle paste mode
  if (event.key.toLowerCase() === 'v' && selectedCategoryId.value) {
    isPasteMode.value = !isPasteMode.value
    return
  }

  // R - random statement
  if (event.key.toLowerCase() === 'r' && selectedCategoryId.value) {
    const random = statementsStore.getRandomFromCategory(selectedCategoryId.value)
    if (random) {
      handleItemSelect(random)
    }
    return
  }

  // Number/letter selection
  const key = event.key.toUpperCase()
  const index = QWERTY_MAP.indexOf(key as typeof QWERTY_MAP[number])
  if (index !== -1 && index < currentItems.value.length) {
    handleItemSelect(currentItems.value[index])
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const handleItemSelect = (item: Category | Statement) => {
  if ('label' in item) {
    // Category
    selectedCategoryId.value = item.id
  } else {
    // Statement
    if (isPasteMode.value) {
      emit('paste', item.text)
    } else {
      emit('speak', item.text)
    }
  }
}

const handleBack = () => {
  selectedCategoryId.value = null
}

const handleAdd = async () => {
  if (!newItemText.value.trim()) return

  try {
    if (isShowingCategories.value) {
      await categoriesStore.createCategory(newItemText.value)
    } else if (selectedCategoryId.value) {
      await statementsStore.createStatement(selectedCategoryId.value, newItemText.value)
    }
    newItemText.value = ''
    showAddDialog.value = false
  } catch (err) {
    console.error('Failed to add item:', err)
  }
}

const handleDelete = async (item: Category | Statement) => {
  try {
    if ('label' in item) {
      await categoriesStore.deleteCategory(item.id)
    } else {
      await statementsStore.deleteStatement(item.id)
    }
  } catch (err) {
    console.error('Failed to delete item:', err)
  }
}

const handleEdit = (item: Category | Statement) => {
  editingItem.value = item
  editItemText.value = 'label' in item ? item.label : item.text
  showEditDialog.value = true
}

const handleEditSave = async () => {
  if (!editingItem.value || !editItemText.value.trim()) return

  try {
    if ('label' in editingItem.value) {
      await categoriesStore.updateCategoryLabel(editingItem.value.id, editItemText.value)
    } else {
      await statementsStore.updateStatementText(editingItem.value.id, editItemText.value)
    }
    showEditDialog.value = false
    editingItem.value = null
    editItemText.value = ''
  } catch (err) {
    console.error('Failed to edit item:', err)
  }
}

const handleTextEditorSave = async (statements: string[]) => {
  if (!selectedCategoryId.value) return

  try {
    // Delete all existing statements
    const existing = statementsStore.getByCategoryId(selectedCategoryId.value)
    await Promise.all(existing.map(s => statementsStore.deleteStatement(s.id)))

    // Create new statements
    await Promise.all(statements.map(text => 
      statementsStore.createStatement(selectedCategoryId.value!, text)
    ))

    isTextEditorMode.value = false
  } catch (err) {
    console.error('Failed to save text editor changes:', err)
  }
}

const handleRandomStatement = () => {
  if (!selectedCategoryId.value) return
  
  const random = statementsStore.getRandomFromCategory(selectedCategoryId.value)
  if (random) {
    if (isPasteMode.value) {
      emit('paste', random.text)
    } else {
      emit('speak', random.text)
    }
  }
}

const getItemLabel = (item: Category | Statement): string => {
  return 'label' in item ? item.label : item.text
}

const getShortcutKey = (index: number): string => {
  return QWERTY_MAP[index] || ''
}
</script>

<template>
  <div
    class="bank-container"
    role="region"
    :aria-label="t('a11y.categoryList')"
  >
    <div class="bank-header">
      <VBtn
        v-if="!isShowingCategories"
        icon
        variant="text"
        size="small"
        :aria-label="t('bank.back')"
        @click="handleBack"
      >
        <VIcon>mdi-arrow-left</VIcon>
      </VBtn>
      <VIcon
        class="mr-2"
        color="primary"
      >
        {{ isShowingCategories ? 'mdi-folder' : 'mdi-message-text' }}
      </VIcon>
      <span class="text-subtitle-1 font-weight-medium">
        {{ isShowingCategories ? t('bank.categories') : t('bank.statements') }}
      </span>
      <VSpacer />
      
      <VBtn
        v-if="!isShowingCategories"
        :variant="isPasteMode ? 'flat' : 'outlined'"
        :color="isPasteMode ? 'secondary' : 'default'"
        size="small"
        class="mr-2"
        @click="isPasteMode = !isPasteMode"
      >
        <VIcon start>
          mdi-content-paste
        </VIcon>
        {{ t('bank.pasteMode') }}
      </VBtn>

      <VBtn
        v-if="!isShowingCategories"
        icon
        variant="text"
        size="small"
        :aria-label="t('bank.reader')"
        @click="isReaderMode = true"
      >
        <VIcon>mdi-book-open-variant</VIcon>
      </VBtn>

      <VBtn
        v-if="!isShowingCategories"
        icon
        variant="text"
        size="small"
        :aria-label="t('bank.textEditor')"
        @click="isTextEditorMode = true"
      >
        <VIcon>mdi-text-box-edit</VIcon>
      </VBtn>

      <VBtn
        v-if="!isShowingCategories"
        icon
        variant="text"
        size="small"
        color="accent"
        :aria-label="t('bank.random')"
        @click="handleRandomStatement"
      >
        <VIcon>mdi-dice-multiple</VIcon>
      </VBtn>

      <VBtn
        icon
        variant="text"
        size="small"
        color="primary"
        :aria-label="isShowingCategories ? t('bank.addCategory') : t('bank.addStatement')"
        @click="showAddDialog = true"
      >
        <VIcon>mdi-plus</VIcon>
      </VBtn>
    </div>

    <VList
      v-if="currentItems.length > 0"
      class="bank-list"
      :aria-label="isShowingCategories ? t('a11y.categoryList') : t('a11y.statementList')"
    >
      <VListItem
        v-for="(item, index) in currentItems"
        :key="'id' in item ? item.id : index"
        class="list-item"
        :aria-keyshortcuts="getShortcutKey(index)"
        @click="handleItemSelect(item)"
      >
        <template #prepend>
          <span class="item-number">{{ getShortcutKey(index) }}</span>
        </template>
        <VListItemTitle class="item-text">
          {{ getItemLabel(item) }}
        </VListItemTitle>
        <template #append>
          <VBtn
            icon
            variant="text"
            size="small"
            :aria-label="t('actions.edit')"
            @click.stop="handleEdit(item)"
          >
            <VIcon size="small">
              mdi-pencil
            </VIcon>
          </VBtn>
          <VBtn
            icon
            variant="text"
            size="small"
            color="error"
            :aria-label="t('actions.delete')"
            @click.stop="handleDelete(item)"
          >
            <VIcon size="small">
              mdi-delete
            </VIcon>
          </VBtn>
        </template>
      </VListItem>
    </VList>

    <div
      v-else
      class="text-center pa-8 text-medium-emphasis"
    >
      {{ t('bank.empty') }}
    </div>

    <!-- Add Dialog -->
    <VDialog
      v-model="showAddDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle>
          {{ isShowingCategories ? t('bank.addCategory') : t('bank.addStatement') }}
        </VCardTitle>
        <VCardText>
          <VTextField
            v-model="newItemText"
            :label="isShowingCategories ? t('bank.newCategoryName') : t('bank.newStatementText')"
            autofocus
            @keydown.enter="handleAdd"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showAddDialog = false"
          >
            {{ t('actions.cancel') }}
          </VBtn>
          <VBtn
            color="primary"
            :disabled="!newItemText.trim()"
            @click="handleAdd"
          >
            {{ t('actions.add') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Dialog -->
    <VDialog
      v-model="showEditDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle>
          {{ editingItem && 'label' in editingItem ? t('bank.editCategory') : t('bank.editStatement') }}
        </VCardTitle>
        <VCardText>
          <VTextField
            v-model="editItemText"
            :label="editingItem && 'label' in editingItem ? t('bank.categoryName') : t('bank.statementText')"
            autofocus
            @keydown.enter="handleEditSave"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showEditDialog = false"
          >
            {{ t('actions.cancel') }}
          </VBtn>
          <VBtn
            color="primary"
            :disabled="!editItemText.trim()"
            @click="handleEditSave"
          >
            {{ t('actions.save') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Reader Mode -->
    <Reader
      v-if="isReaderMode && selectedCategoryId"
      :statements="statementsStore.getByCategoryId(selectedCategoryId)"
      @close="isReaderMode = false"
    />

    <!-- Text Editor Mode -->
    <TextEditor
      v-if="isTextEditorMode && selectedCategoryId"
      :statements="statementsStore.getByCategoryId(selectedCategoryId)"
      :category-id="selectedCategoryId"
      @close="isTextEditorMode = false"
      @save="handleTextEditorSave"
    />
  </div>
</template>

