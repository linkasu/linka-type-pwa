<script setup lang="ts">
import type { GlobalCategory, Statement } from '~/types/api'
import { useCategoriesStore } from '~/stores/categories'

const { t } = useI18n()
const { api } = useAppServices()
const categoriesStore = useCategoriesStore()

const globalCategories = ref<GlobalCategory[]>([])
const isLoading = ref(false)
const expandedCategory = ref<string | null>(null)
const categoryStatements = ref<Map<string, Statement[]>>(new Map())
const importingId = ref<string | null>(null)
const failedImportId = ref<string | null>(null)
const loadError = ref(false)
const importStatus = ref<'success' | 'error' | null>(null)

onMounted(async () => {
  await loadGlobalCategories()
})

const loadGlobalCategories = async () => {
  isLoading.value = true
  loadError.value = false
  try {
    globalCategories.value = await api.global.getCategories()
  } catch (err) {
    console.error('Failed to load global categories:', err)
    loadError.value = true
  } finally {
    isLoading.value = false
  }
}

const loadCategoryStatements = async (categoryId: string) => {
  if (categoryStatements.value.has(categoryId)) return

  try {
    const statements = await api.global.getCategoryStatements(categoryId)
    categoryStatements.value.set(categoryId, statements)
  } catch (err) {
    console.error('Failed to load statements:', err)
  }
}

const toggleCategory = async (categoryId: string) => {
  if (expandedCategory.value === categoryId) {
    expandedCategory.value = null
  } else {
    expandedCategory.value = categoryId
    await loadCategoryStatements(categoryId)
  }
}

const importCategory = async (categoryId: string) => {
  importingId.value = categoryId
  importStatus.value = null
  failedImportId.value = null
  try {
    await api.global.importCategory({ categoryId, force: false })
    importStatus.value = 'success'
    await categoriesStore.fetchCategories().catch((err: unknown) => {
      console.error('Failed to refresh imported categories:', err)
    })
  } catch (err) {
    console.error('Failed to import category:', err)
    failedImportId.value = categoryId
    importStatus.value = 'error'
  } finally {
    importingId.value = null
  }
}
</script>

<template>
  <div>
    <VAlert
      v-if="importStatus"
      :type="importStatus === 'success' ? 'success' : 'error'"
      variant="tonal"
      class="mb-3"
      :role="importStatus === 'error' ? 'alert' : 'status'"
    >
      {{ importStatus === 'success' ? t('settings.importSettings.importSuccess') : t('settings.importSettings.importError') }}
      <template v-if="importStatus === 'error' && failedImportId" #append>
        <VBtn variant="text" @click="importCategory(failedImportId!)">
          {{ t('actions.retry') }}
        </VBtn>
      </template>
    </VAlert>

    <div
      v-if="isLoading"
      class="text-center pa-8"
      role="status"
      aria-live="polite"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

    <VAlert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      role="alert"
    >
      {{ t('settings.importSettings.importError') }}
      <template #append>
        <VBtn variant="text" @click="loadGlobalCategories">
          {{ t('actions.retry') }}
        </VBtn>
      </template>
    </VAlert>

    <VList
      v-else-if="globalCategories.length > 0"
      lines="two"
    >
      <VListItem
        v-for="category in globalCategories"
        :key="category.id"
      >
        <template #prepend>
          <VIcon color="primary">
            mdi-folder
          </VIcon>
        </template>

        <VListItemTitle>{{ category.label }}</VListItemTitle>
        <VListItemSubtitle>
          {{ category.statementsCount || 0 }} {{ t('bank.statements').toLowerCase() }}
        </VListItemSubtitle>

        <template #append>
          <VBtn
            icon
            variant="text"
            size="small"
            :aria-expanded="expandedCategory === category.id"
            @click="toggleCategory(category.id)"
          >
            <VIcon>
              {{ expandedCategory === category.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </VIcon>
          </VBtn>
          <VBtn
            variant="tonal"
            color="primary"
            size="small"
            :loading="importingId === category.id"
            @click="importCategory(category.id)"
          >
            {{ t('settings.importSettings.import') }}
          </VBtn>
        </template>

        <template v-if="expandedCategory === category.id">
          <VList
            density="compact"
            class="ml-8"
          >
            <VListItem
              v-for="statement in categoryStatements.get(category.id) || []"
              :key="statement.id"
            >
              <VListItemTitle class="text-body-2">
                {{ statement.text }}
              </VListItemTitle>
            </VListItem>
          </VList>
        </template>
      </VListItem>
    </VList>

    <div
      v-else
      class="text-center pa-8 text-medium-emphasis"
    >
      {{ t('bank.empty') }}
    </div>
  </div>
</template>
