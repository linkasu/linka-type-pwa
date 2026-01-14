<script setup lang="ts">
import { useAnalytics } from '~/composables/useAnalytics'

const { t } = useI18n()
const { trackMobileAppPrompt, trackMobileAppLinkClicked } = useAnalytics()

const STORAGE_KEY = 'mobileAppPromptDismissed'
const APP_STORE_URL = 'https://apps.apple.com/us/app/linka-%D0%BD%D0%B0%D0%BF%D0%B8%D1%88%D0%B8/id6754614216'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=ru.ibakaidov.distypepro&hl=ru'

const isVisible = ref(false)

const isIOS = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
})

const isAndroid = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
})

const isMobile = computed(() => isIOS.value || isAndroid.value)

const isStandalone = computed(() => {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    nav.standalone === true
  )
})

onMounted(() => {
  if (typeof window === 'undefined') return

  const wasDismissed = localStorage.getItem(STORAGE_KEY) === 'true'
  if (wasDismissed) return

  // Show only on mobile, not in standalone mode
  if (isMobile.value && !isStandalone.value) {
    // Small delay to not show immediately on page load
    setTimeout(() => {
      isVisible.value = true
      const platform = isIOS.value ? 'ios' : 'android'
      trackMobileAppPrompt(platform)
    }, 2000)
  }
})

const openLink = (url: string, platform: 'ios' | 'android') => {
  trackMobileAppLinkClicked(platform)
  window.open(url, '_blank')
  dismiss()
}

const dismiss = () => {
  isVisible.value = false
  localStorage.setItem(STORAGE_KEY, 'true')
}
</script>

<template>
  <VDialog
    v-model="isVisible"
    max-width="360"
    persistent
  >
    <VCard>
      <VCardTitle class="text-h6 font-weight-bold">
        {{ t('mobileApp.title') }}
      </VCardTitle>
      <VCardText>
        <p class="text-body-2 mb-0">
          {{ t('mobileApp.description') }}
        </p>
      </VCardText>
      <VDivider />
      <VCardActions class="flex-column pa-4">
        <VBtn
          v-if="isIOS"
          block
          color="primary"
          class="mb-3"
          prepend-icon="mdi-apple"
          @click="openLink(APP_STORE_URL, 'ios')"
        >
          {{ t('mobileApp.appStore') }}
        </VBtn>
        <VBtn
          v-if="isAndroid"
          block
          color="success"
          class="mb-3"
          prepend-icon="mdi-google-play"
          @click="openLink(PLAY_STORE_URL, 'android')"
        >
          {{ t('mobileApp.playStore') }}
        </VBtn>
        <VBtn
          variant="text"
          block
          color="secondary"
          @click="dismiss"
        >
          {{ t('mobileApp.continue') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
