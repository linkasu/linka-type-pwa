<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useCategoriesStore } from '~/stores/categories'
import { useDialogSuggestionsStore } from '~/stores/dialogSuggestions'
import { useStatementsStore } from '~/stores/statements'
import type { DialogSuggestionApplyItem, DialogSuggestionApplyResult } from '~/types/api'

const POLL_INTERVAL = 30000
const NEW_CATEGORY_VALUE = '__new__'

interface SuggestionDraft {
  id: string
  text: string
  categoryValue: string
  newCategoryLabel: string
  isSubmitting: boolean
  error: string | null
}

const { t } = useI18n()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const statementsStore = useStatementsStore()
const suggestionsStore = useDialogSuggestionsStore()

const showDialog = ref(false)
const drafts = ref<SuggestionDraft[]>([])
const lastCategoryId = ref<string | null>(null)
let pollTimer: number | null = null

const categoryOptions = computed(() => {
  const options = categoriesStore.sortedCategories.map(cat => ({
    title: cat.label,
    value: cat.id,
  }))
  options.push({ title: t('dialog.newCategory'), value: NEW_CATEGORY_VALUE })
  return options
})

const pendingCount = computed(() => suggestionsStore.pendingCount)
const snackbarOpen = ref(false)

const buildDefaultCategory = () => {
  if (lastCategoryId.value) return lastCategoryId.value
  if (categoriesStore.sortedCategories.length > 0) {
    return categoriesStore.sortedCategories[0].id
  }
  return NEW_CATEGORY_VALUE
}

const syncDrafts = () => {
  const existing = new Map(drafts.value.map(draft => [draft.id, draft]))
  drafts.value = suggestionsStore.suggestions.map((suggestion) => {
    const prev = existing.get(suggestion.id)
    if (prev) return prev
    return {
      id: suggestion.id,
      text: suggestion.text,
      categoryValue: buildDefaultCategory(),
      newCategoryLabel: '',
      isSubmitting: false,
      error: null,
    }
  })
}

watch(() => suggestionsStore.suggestions, syncDrafts, { immediate: true })

watch(
  pendingCount,
  (count, prev) => {
    const previous = typeof prev === 'number' ? prev : 0
    if (count > previous && !showDialog.value) {
      snackbarOpen.value = true
    }
    if (count === 0) {
      snackbarOpen.value = false
    }
  },
  { immediate: true },
)

const startPolling = () => {
  if (!authStore.token) return
  void suggestionsStore.fetchSuggestions(true)
  if (import.meta.client) {
    if (pollTimer) return
    pollTimer = window.setInterval(() => {
      if (!authStore.token) return
      void suggestionsStore.fetchSuggestions()
    }, POLL_INTERVAL)
  }
}

const stopPolling = () => {
  if (import.meta.client && pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

watch(
  () => authStore.token,
  (token) => {
    if (token) {
      startPolling()
    } else {
      stopPolling()
      suggestionsStore.suggestions = []
      snackbarOpen.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  stopPolling()
})

const openDialog = async () => {
  showDialog.value = true
  snackbarOpen.value = false
  if (!categoriesStore.sortedCategories.length) {
    try {
      await categoriesStore.fetchCategories()
    } catch {
      // ignore category load errors
    }
  }
}

const closeDialog = () => {
  showDialog.value = false
}

const updateLastCategory = (value: string) => {
  if (value && value !== NEW_CATEGORY_VALUE) {
    lastCategoryId.value = value
  }
}

const applySuggestion = async (draft: SuggestionDraft) => {
  draft.error = null

  const item: DialogSuggestionApplyItem = { id: draft.id }
  if (draft.categoryValue === NEW_CATEGORY_VALUE) {
    const label = draft.newCategoryLabel.trim()
    if (!label) {
      draft.error = t('dialog.errors.categoryLabel')
      return
    }
    item.categoryLabel = label
  } else if (draft.categoryValue) {
    item.categoryId = draft.categoryValue
  } else {
    draft.error = t('dialog.errors.categoryRequired')
    return
  }

  draft.isSubmitting = true
  try {
    const result = await suggestionsStore.applySuggestions([item])
    await applyResultToBank(result, draft, item)
  } catch (err: unknown) {
    const error = err as Error
    draft.error = error.message || t('dialog.errors.applyFailed')
  } finally {
    draft.isSubmitting = false
  }
}

const applyResultToBank = async (
  result: DialogSuggestionApplyResult,
  draft: SuggestionDraft,
  item: DialogSuggestionApplyItem,
) => {
  const created = result.created?.[0]
  if (!created) return

  const categoryId = created.categoryId
  const statementId = created.statementId
  const existingCategory = categoriesStore.getById(categoryId)

  if (!existingCategory) {
    const label =
      item.categoryLabel
      ?? categoriesStore.getById(item.categoryId || '')?.label
      ?? t('dialog.unknownCategory')
    categoriesStore.updateCategory({
      id: categoryId,
      label,
      created: Date.now(),
      default: false,
      aiUse: false,
    })
  }

  statementsStore.addStatementLocal({
    id: statementId,
    categoryId,
    text: draft.text,
    created: Date.now(),
  })

  updateLastCategory(categoryId)
}

const dismissSuggestion = async (draft: SuggestionDraft) => {
  draft.error = null
  draft.isSubmitting = true
  try {
    await suggestionsStore.dismissSuggestions([draft.id])
  } catch (err: unknown) {
    const error = err as Error
    draft.error = error.message || t('dialog.errors.dismissFailed')
  } finally {
    draft.isSubmitting = false
  }
}
</script>

<template>
  <VSnackbar
    v-model="snackbarOpen"
    color="primary"
    :timeout="-1"
    location="bottom right"
  >
    <div class="d-flex align-center gap-2">
      <div>
        {{ t('dialog.suggestionsReady', { count: pendingCount }) }}
      </div>
      <VBtn
        variant="text"
        class="ml-2"
        @click="openDialog"
      >
        {{ t('dialog.openSuggestions') }}
      </VBtn>
    </div>
  </VSnackbar>

  <VDialog
    v-model="showDialog"
    max-width="800"
    scrollable
  >
    <VCard>
      <VToolbar
        color="primary"
        dark
      >
        <VBtn
          icon
          @click="closeDialog"
        >
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle>{{ t('dialog.title') }}</VToolbarTitle>
        <VSpacer />
        <VChip
          size="small"
          variant="flat"
          color="white"
        >
          {{ pendingCount }}
        </VChip>
      </VToolbar>

      <VCardText class="pa-4">
        <div v-if="!drafts.length" class="text-medium-emphasis">
          {{ t('dialog.noSuggestions') }}
        </div>

        <div
          v-for="draft in drafts"
          :key="draft.id"
          class="suggestion-row"
        >
          <div class="suggestion-text">
            {{ draft.text }}
          </div>

          <div class="suggestion-controls">
            <VSelect
              v-model="draft.categoryValue"
              :items="categoryOptions"
              :label="t('dialog.categoryLabel')"
              density="comfortable"
              hide-details="auto"
              @update:model-value="updateLastCategory"
            />
            <VTextField
              v-if="draft.categoryValue === NEW_CATEGORY_VALUE"
              v-model="draft.newCategoryLabel"
              :label="t('dialog.newCategoryLabel')"
              density="comfortable"
              hide-details="auto"
            />
          </div>

          <div
            v-if="draft.error"
            class="text-error text-caption mt-2"
          >
            {{ draft.error }}
          </div>

          <div class="suggestion-actions">
            <VBtn
              color="primary"
              :loading="draft.isSubmitting"
              @click="applySuggestion(draft)"
            >
              {{ t('actions.add') }}
            </VBtn>
            <VBtn
              variant="text"
              color="error"
              :loading="draft.isSubmitting"
              @click="dismissSuggestion(draft)"
            >
              {{ t('actions.dismiss') }}
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.suggestion-row {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-text {
  font-weight: 500;
  font-size: 1rem;
}

.suggestion-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.suggestion-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
