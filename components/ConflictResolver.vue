<script setup lang="ts">
import type { Category, Statement } from '~/types/api'
import type { SyncConflict, CategoryUpdatePayload, StatementUpdatePayload } from '~/types/offline'
import { useOfflineQueueStore } from '~/stores/offlineQueue'

const { t } = useI18n()
const offlineQueueStore = useOfflineQueueStore()

const conflicts = computed(() => offlineQueueStore.conflicts)
const hasConflicts = computed(() => conflicts.value.length > 0)

const currentConflict = computed(() => conflicts.value[0])

const isCategory = computed(() => currentConflict.value?.entityType === 'category')
const isDeletedRemotely = computed(() => currentConflict.value?.conflictType === 'update_delete')

const localValue = computed(() => {
  if (!currentConflict.value) return ''
  if (isCategory.value) {
    const payload = currentConflict.value.localChange.payload as CategoryUpdatePayload
    return payload.label
  } else {
    const payload = currentConflict.value.localChange.payload as StatementUpdatePayload
    return payload.text
  }
})

const remoteValue = computed(() => {
  if (!currentConflict.value || !currentConflict.value.remoteData) return ''
  if (isCategory.value) {
    return (currentConflict.value.remoteData as Category).label
  } else {
    return (currentConflict.value.remoteData as Statement).text
  }
})

const entityTypeLabel = computed(() => {
  if (!currentConflict.value) return ''
  return isCategory.value ? t('conflict.category') : t('conflict.statement')
})

const isResolving = ref(false)

const resolveWithLocal = async () => {
  if (!currentConflict.value) return
  isResolving.value = true
  try {
    await offlineQueueStore.resolveConflict(currentConflict.value.id, 'local')
  } finally {
    isResolving.value = false
  }
}

const resolveWithRemote = async () => {
  if (!currentConflict.value) return
  isResolving.value = true
  try {
    await offlineQueueStore.resolveConflict(currentConflict.value.id, 'remote')
  } finally {
    isResolving.value = false
  }
}
</script>

<template>
  <VDialog
    :model-value="hasConflicts"
    persistent
    max-width="500"
    scrollable
  >
    <VCard v-if="currentConflict" class="conflict-card">
      <VCardTitle class="d-flex align-center">
        <VIcon
          color="warning"
          class="mr-2"
        >
          mdi-alert-circle
        </VIcon>
        {{ t('conflict.title') }}
      </VCardTitle>

      <VCardSubtitle v-if="conflicts.length > 1">
        {{ t('conflict.conflictCount', { count: conflicts.length }, conflicts.length) }}
      </VCardSubtitle>

      <VCardText class="conflict-text">
        <p class="mb-4">
          {{ isDeletedRemotely ? t('conflict.deletedRemotely') : t('conflict.description') }}
        </p>

        <VChip
          size="small"
          class="mb-4"
        >
          {{ entityTypeLabel }}
        </VChip>

        <div class="conflict-comparison">
          <div class="conflict-version">
            <div class="text-subtitle-2 mb-1">
              {{ t('conflict.localVersion') }}
            </div>
            <VCard
              variant="outlined"
              class="pa-3"
            >
              <span class="text-body-2">{{ localValue }}</span>
            </VCard>
          </div>

          <div
            v-if="!isDeletedRemotely"
            class="conflict-version mt-4"
          >
            <div class="text-subtitle-2 mb-1">
              {{ t('conflict.remoteVersion') }}
            </div>
            <VCard
              variant="outlined"
              class="pa-3"
            >
              <span class="text-body-2">{{ remoteValue }}</span>
            </VCard>
          </div>
        </div>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          v-if="!isDeletedRemotely"
          variant="outlined"
          :loading="isResolving"
          @click="resolveWithRemote"
        >
          {{ t('conflict.useRemote') }}
        </VBtn>
        <VBtn
          color="primary"
          :loading="isResolving"
          @click="resolveWithLocal"
        >
          {{ t('conflict.useLocal') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.conflict-comparison {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conflict-version {
  flex: 1;
}

.conflict-card {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
}

.conflict-text { overflow-wrap: anywhere; }
</style>
