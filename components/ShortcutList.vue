<script setup lang="ts">
import { SHORTCUTS_DATA } from '~/types/shortcuts'

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const shortcuts = computed(() =>
  SHORTCUTS_DATA.map(s => ({
    keys: s.keys,
    description: t(s.descriptionKey),
    category: t(s.categoryKey),
  })),
)

const groupedShortcuts = computed(() => {
  const groups: Record<string, typeof shortcuts.value> = {}
  shortcuts.value.forEach((shortcut) => {
    if (!groups[shortcut.category]) {
      groups[shortcut.category] = []
    }
    groups[shortcut.category].push(shortcut)
  })
  return groups
})

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <VDialog
    :model-value="true"
    max-width="700"
    scrollable
    @update:model-value="emit('close')"
  >
    <VCard>
      <VToolbar
        color="primary"
        dark
      >
        <VBtn
          icon
          :aria-label="t('actions.close')"
          @click="emit('close')"
        >
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle>{{ t('shortcuts.title') }}</VToolbarTitle>
      </VToolbar>

      <VCardText class="pa-0">
        <div
          v-for="(items, category) in groupedShortcuts"
          :key="category"
          class="shortcut-category"
        >
          <div class="category-header pa-4 bg-surface-variant">
            <VIcon
              start
              size="small"
            >
              mdi-folder-outline
            </VIcon>
            <span class="text-subtitle-1 font-weight-medium">{{ category }}</span>
          </div>

          <VList>
            <VListItem
              v-for="(shortcut, index) in items"
              :key="index"
              class="shortcut-item"
            >
              <template #prepend>
                <VChip
                  size="small"
                  variant="flat"
                  color="primary"
                  class="shortcut-chip"
                >
                  {{ shortcut.keys }}
                </VChip>
              </template>
              <VListItemTitle>{{ shortcut.description }}</VListItemTitle>
            </VListItem>
          </VList>
        </div>
      </VCardText>

      <VCardActions class="justify-end pa-4">
        <VBtn
          color="primary"
          variant="flat"
          @click="emit('close')"
        >
          {{ t('actions.close') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.shortcut-category {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.shortcut-category:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortcut-item {
  padding: 12px 16px;
}

.shortcut-chip {
  font-family: 'Roboto Mono', monospace;
  min-width: 80px;
  justify-content: center;
}
</style>
