<script setup lang="ts">
import type { GlobalCategory, Statement } from '~/types/api'

const { t } = useI18n()
const { $api } = useNuxtApp()

const globalCategories = ref<GlobalCategory[]>([])
const isLoading = ref(false)
const expandedCategory = ref<string | null>(null)
const categoryStatements = ref<Map<string, Statement[]>>(new Map())
const importingId = ref<string | null>(null)

onMounted(async () => {
  await loadGlobalCategories()
})

const loadGlobalCategories = async () => {
  isLoading.value = true
  try {
    globalCategories.value = await $api.global.getCategories()
  } catch (err) {
    console.error('Failed to load global categories:', err)
  } finally {
    isLoading.value = false
  }
}

const loadCategoryStatements = async (categoryId: string) => {
  if (categoryStatements.value.has(categoryId)) return

  try {
    const statements = await $api.global.getCategoryStatements(categoryId)
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
  try {
    await $api.global.importCategory({ categoryId, force: false })
    // Show success message
  } catch (err) {
    console.error('Failed to import category:', err)
  } finally {
    importingId.value = null
  }
}
</script>

<template>
  <div>
    <div
      v-if="isLoading"
      class="text-center pa-8"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>

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
