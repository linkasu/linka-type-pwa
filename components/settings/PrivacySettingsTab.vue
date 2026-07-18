<script setup lang="ts">
import { ref } from 'vue'
import { useAnalytics } from '~/composables/useAnalytics'
import { ANALYTICS_CONSENT, type AnalyticsConsentDecision } from '~/types/analytics'

const { t } = useI18n()
const { consentState, setConsent } = useAnalytics()
const isUpdating = ref(false)

const choose = async (value: unknown) => {
  if (value !== ANALYTICS_CONSENT.Enabled && value !== ANALYTICS_CONSENT.Disabled) return

  isUpdating.value = true
  try {
    await setConsent(value as AnalyticsConsentDecision)
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <VCard>
    <VCardTitle>{{ t('privacy.title') }}</VCardTitle>
    <VCardText>
      <p class="mb-4">
        {{ t('privacy.analyticsDescription') }}
      </p>

      <VRadioGroup
        :model-value="consentState === ANALYTICS_CONSENT.Unknown ? null : consentState"
        :disabled="isUpdating"
        @update:model-value="choose"
      >
        <VRadio
          :value="ANALYTICS_CONSENT.Enabled"
          :label="t('privacy.enable')"
        />
        <VRadio
          :value="ANALYTICS_CONSENT.Disabled"
          :label="t('privacy.disable')"
        />
      </VRadioGroup>

      <VAlert
        v-if="consentState === ANALYTICS_CONSENT.Unknown"
        type="info"
        variant="tonal"
        class="mb-5"
      >
        {{ t('privacy.unknown') }}
      </VAlert>

      <VDivider class="mb-4" />
      <div class="text-h6 mb-2">
        {{ t('privacy.processingTitle') }}
      </div>
      <p class="mb-3">
        {{ t('privacy.processingIntro') }}
      </p>
      <VList density="compact" lines="two">
        <VListItem prepend-icon="mdi-account-lock" :title="t('privacy.accountTitle')">
          <template #subtitle>{{ t('privacy.accountDescription') }}</template>
        </VListItem>
        <VListItem prepend-icon="mdi-volume-high" :title="t('privacy.ttsTitle')">
          <template #subtitle>{{ t('privacy.ttsDescription') }}</template>
        </VListItem>
        <VListItem prepend-icon="mdi-lightbulb-outline" :title="t('privacy.predictorTitle')">
          <template #subtitle>{{ t('privacy.predictorDescription') }}</template>
        </VListItem>
        <VListItem prepend-icon="mdi-message-processing-outline" :title="t('privacy.dialogTitle')">
          <template #subtitle>{{ t('privacy.dialogDescription') }}</template>
        </VListItem>
      </VList>
      <VAlert type="success" variant="tonal" class="mt-4">
        {{ t('privacy.notTelemetry') }}
      </VAlert>
    </VCardText>
  </VCard>
</template>
