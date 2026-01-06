<script setup lang="ts">
const { t } = useI18n()

const isOnline = ref(true)

onMounted(() => {
  isOnline.value = navigator.onLine

  const handleOnline = () => { isOnline.value = true }
  const handleOffline = () => { isOnline.value = false }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })
})
</script>

<template>
  <Transition name="slide">
    <div
      v-if="!isOnline"
      class="offline-indicator visible"
      role="alert"
      aria-live="assertive"
    >
      <VIcon
        size="small"
        class="mr-2"
      >
        mdi-wifi-off
      </VIcon>
      {{ t('status.offline') }}
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
</style>

