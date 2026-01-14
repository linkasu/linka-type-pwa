<script setup lang="ts">
const { t } = useI18n()

const showUpdate = ref(false)
const registration = ref<ServiceWorkerRegistration | null>(null)

onMounted(() => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  // Listen for SW updates
  navigator.serviceWorker.ready.then((reg) => {
    registration.value = reg

    // Check for updates periodically
    setInterval(() => {
      reg.update()
    }, 60 * 60 * 1000) // Every hour
  })

  // Listen for controller change (new SW activated)
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })

  // Listen for new SW waiting
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATE_AVAILABLE') {
      showUpdate.value = true
    }
  })

  // Check if there's already a waiting SW
  navigator.serviceWorker.ready.then((reg) => {
    if (reg.waiting) {
      showUpdate.value = true
    }

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdate.value = true
        }
      })
    })
  })
})

const handleUpdate = () => {
  if (registration.value?.waiting) {
    registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
  }
  showUpdate.value = false
}

const handleDismiss = () => {
  showUpdate.value = false
}
</script>

<template>
  <VSnackbar
    v-model="showUpdate"
    :timeout="-1"
    color="primary"
    location="bottom"
    multi-line
  >
    <div class="d-flex align-center">
      <VIcon class="mr-3">mdi-update</VIcon>
      <span>{{ t('update.available') }}</span>
    </div>
    <template #actions>
      <VBtn
        variant="text"
        @click="handleDismiss"
      >
        {{ t('update.later') }}
      </VBtn>
      <VBtn
        variant="flat"
        color="white"
        @click="handleUpdate"
      >
        {{ t('update.now') }}
      </VBtn>
    </template>
  </VSnackbar>
</template>
