<script setup lang="ts">
import { ref } from 'vue'
import { useAnalytics } from '~/composables/useAnalytics'
import { ANALYTICS_CONSENT, type AnalyticsConsentDecision } from '~/types/analytics'

const { t } = useI18n()
const { consentState, noticeDismissed, setConsent, dismissNotice } = useAnalytics()
const isUpdating = ref(false)

const choose = async (decision: AnalyticsConsentDecision) => {
  isUpdating.value = true
  try {
    await setConsent(decision)
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <VAlert
    v-if="consentState === ANALYTICS_CONSENT.Unknown && !noticeDismissed"
    type="info"
    variant="tonal"
    border="start"
    class="ma-3"
    :title="t('privacy.notice.title')"
  >
    <p class="mb-2">
      {{ t('privacy.notice.analytics') }}
    </p>
    <p class="mb-3">
      {{ t('privacy.notice.processing') }}
    </p>
    <div class="d-flex flex-wrap ga-2">
      <VBtn
        color="primary"
        variant="flat"
        :loading="isUpdating"
        @click="choose(ANALYTICS_CONSENT.Enabled)"
      >
        {{ t('privacy.enable') }}
      </VBtn>
      <VBtn
        color="primary"
        variant="outlined"
        :disabled="isUpdating"
        @click="choose(ANALYTICS_CONSENT.Disabled)"
      >
        {{ t('privacy.disable') }}
      </VBtn>
      <VBtn
        variant="text"
        :disabled="isUpdating"
        @click="dismissNotice"
      >
        {{ t('privacy.later') }}
      </VBtn>
    </div>
  </VAlert>
</template>
