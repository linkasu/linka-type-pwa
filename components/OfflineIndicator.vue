<script setup lang="ts">
import { useOfflineQueueStore } from '~/stores/offlineQueue'

const { t } = useI18n()

const isOnline = ref(true)
const offlineQueueStore = useOfflineQueueStore()

const pendingCount = computed(() => offlineQueueStore.pendingCount)
const isSyncing = computed(() => offlineQueueStore.isFlushing)
const syncError = computed(() => offlineQueueStore.lastError)

const showIndicator = computed(() => {
  return !isOnline.value || pendingCount.value > 0 || isSyncing.value || syncError.value
})

const icon = computed(() => {
  if (!isOnline.value) return 'mdi-wifi-off'
  if (syncError.value) return 'mdi-cloud-alert'
  if (isSyncing.value) return 'mdi-cloud-sync'
  if (pendingCount.value > 0) return 'mdi-cloud-upload-outline'
  return 'mdi-cloud-check'
})

const statusText = computed(() => {
  if (!isOnline.value) {
    return pendingCount.value > 0
      ? t('status.offlineWithPending')
      : t('status.offline')
  }
  if (syncError.value) return `${t('status.syncError')}: ${syncError.value}`
  if (isSyncing.value) return t('status.syncing')
  if (pendingCount.value > 0) return t('status.pendingSync', { count: pendingCount.value }, pendingCount.value)
  return t('status.synced')
})

const indicatorClass = computed(() => ({
  'offline-indicator': true,
  offline: !isOnline.value,
  syncing: isSyncing.value,
  pending: isOnline.value && pendingCount.value > 0 && !isSyncing.value,
  error: Boolean(syncError.value),
  synced: isOnline.value && pendingCount.value === 0 && !isSyncing.value && !syncError.value,
}))

const canSync = computed(() => {
  return isOnline.value && pendingCount.value > 0 && !isSyncing.value
})

const syncNow = async () => {
  await offlineQueueStore.flush()
}

onMounted(() => {
  isOnline.value = navigator.onLine

  const handleOnline = () => {
    isOnline.value = true
    // Auto-sync when coming back online
    if (pendingCount.value > 0) {
      offlineQueueStore.flush()
    }
  }
  const handleOffline = () => { isOnline.value = false }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Hydrate pending count on mount
  offlineQueueStore.hydrate()

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })
})
</script>

<template>
  <Transition name="slide">
    <div
      v-if="showIndicator"
      :class="indicatorClass"
      role="alert"
      aria-live="assertive"
    >
      <VIcon
        size="small"
        class="mr-2"
        :class="{ 'sync-spin': isSyncing }"
      >
        {{ icon }}
      </VIcon>
      <span class="status-text">{{ statusText }}</span>
      <VBtn
        v-if="canSync"
        size="x-small"
        variant="text"
        class="ml-2 sync-btn"
        :loading="isSyncing"
        @click="syncNow"
      >
        {{ t('actions.syncNow') }}
      </VBtn>
      <VBtn
        v-if="syncError && isOnline"
        size="x-small"
        variant="text"
        class="ml-2 retry-btn"
        :loading="isSyncing"
        @click="syncNow"
      >
        {{ t('actions.retry') }}
      </VBtn>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}

.offline-indicator {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 0.875rem;
}

.offline-indicator.offline {
  background-color: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
}

.offline-indicator.syncing {
  background-color: rgb(var(--v-theme-info));
  color: rgb(var(--v-theme-on-info));
}

.offline-indicator.pending {
  background-color: rgb(var(--v-theme-warning));
  color: rgb(var(--v-theme-on-warning));
}

.offline-indicator.error {
  background-color: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
}

.offline-indicator.synced {
  background-color: rgb(var(--v-theme-success));
  color: rgb(var(--v-theme-on-success));
}

.status-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sync-btn,
.retry-btn {
  flex-shrink: 0;
  min-height: 44px;
}

.sync-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

