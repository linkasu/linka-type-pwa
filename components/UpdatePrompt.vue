<script setup lang="ts">
import { useAnalytics } from '~/composables/useAnalytics'

const { t } = useI18n()
const { trackUpdatePromptShown, trackUpdateAccepted } = useAnalytics()

const showUpdate = ref(false)
const registration = ref<ServiceWorkerRegistration | null>(null)
const desktopUpdateState = ref<'idle' | 'available' | 'downloaded' | 'downloading' | 'checking' | 'error'>('idle')
const desktopUpdateMessage = ref('')
const isDesktop = computed(() => Boolean(window.desktop))

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  if (window.desktop) {
    const unsubscribe = window.desktop.updates.onStatus((payload) => {
      const state = String(payload.state || 'idle') as typeof desktopUpdateState.value
      desktopUpdateState.value = state
      desktopUpdateMessage.value = payload.message ? String(payload.message) : ''
      if (state === 'available' || state === 'downloaded') {
        showUpdate.value = true
        trackUpdatePromptShown()
      }
    })

    window.desktop.updates.check().catch(() => undefined)

    onUnmounted(() => {
      unsubscribe()
    })
    return
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  navigator.serviceWorker.ready.then((reg) => {
    registration.value = reg

    setInterval(() => {
      reg.update()
    }, 60 * 60 * 1000) // Every hour
  })

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
      trackUpdatePromptShown()
    }
  })

  // Check if there's already a waiting SW
  navigator.serviceWorker.ready.then((reg) => {
    if (reg.waiting) {
      showUpdate.value = true
      trackUpdatePromptShown()
    }

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdate.value = true
          trackUpdatePromptShown()
        }
      })
    })
  })
})

const handleUpdate = () => {
  trackUpdateAccepted()
  if (window.desktop) {
    if (desktopUpdateState.value === 'available') {
      window.desktop.updates.download().catch(() => undefined)
      return
    }
    if (desktopUpdateState.value === 'downloaded') {
      window.desktop.updates.install()
      return
    }
  }

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
      <span>
        {{
          isDesktop && desktopUpdateState === 'downloaded'
            ? 'Обновление загружено. Перезапустить для установки?'
            : isDesktop && desktopUpdateState === 'downloading'
              ? 'Загрузка обновления...'
              : t('update.available')
        }}
      </span>
    </div>
    <div v-if="desktopUpdateMessage" class="text-caption mt-2">{{ desktopUpdateMessage }}</div>
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
        :disabled="isDesktop && desktopUpdateState === 'downloading'"
        @click="handleUpdate"
      >
        {{
          isDesktop && desktopUpdateState === 'available'
            ? 'Скачать'
            : isDesktop && desktopUpdateState === 'downloaded'
              ? 'Установить'
              : t('update.now')
        }}
      </VBtn>
    </template>
  </VSnackbar>
</template>
