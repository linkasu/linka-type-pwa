<script setup lang="ts">
const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

interface Shortcut {
  keys: string
  description: string
  category: string
}

const shortcuts = computed<Shortcut[]>(() => [
  // Global
  {
    keys: 'Ctrl + ↑ / ↓',
    description: t('shortcuts.switchChat'),
    category: t('shortcuts.global'),
  },
  {
    keys: 'Ctrl + 0',
    description: t('shortcuts.focusQuickes'),
    category: t('shortcuts.global'),
  },
  {
    keys: 'Ctrl + ;',
    description: t('shortcuts.focusBank'),
    category: t('shortcuts.global'),
  },
  {
    keys: 'Enter',
    description: t('shortcuts.speak'),
    category: t('shortcuts.global'),
  },
  {
    keys: 'Ctrl + Enter',
    description: t('shortcuts.newLine'),
    category: t('shortcuts.global'),
  },
  // Predictor
  {
    keys: '1-5',
    description: t('shortcuts.selectPrediction'),
    category: t('shortcuts.predictor'),
  },
  // Quickes
  {
    keys: '1-6',
    description: t('shortcuts.speakQuicke'),
    category: t('shortcuts.quickes'),
  },
  // Bank
  {
    keys: '1-9, A-Z',
    description: t('shortcuts.selectItem'),
    category: t('shortcuts.bank'),
  },
  {
    keys: 'R',
    description: t('shortcuts.randomStatement'),
    category: t('shortcuts.bank'),
  },
  {
    keys: 'V',
    description: t('shortcuts.togglePasteMode'),
    category: t('shortcuts.bank'),
  },
  {
    keys: 'Esc',
    description: t('shortcuts.back'),
    category: t('shortcuts.bank'),
  },
  // Reader
  {
    keys: 'Space',
    description: t('shortcuts.playPause'),
    category: t('shortcuts.reader'),
  },
  {
    keys: '← / →',
    description: t('shortcuts.navigate'),
    category: t('shortcuts.reader'),
  },
])

const groupedShortcuts = computed(() => {
  const groups: Record<string, Shortcut[]> = {}
  shortcuts.value.forEach(shortcut => {
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
          @click="emit('close')"
        >
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle>{{ t('shortcuts.title') }}</VToolbarTitle>
      </VToolbar>

      <VCardText class="pa-0">
        <div
          v-for="(shortcuts, category) in groupedShortcuts"
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
              v-for="(shortcut, index) in shortcuts"
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

