<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useVoiceLoader } from '~/composables/useVoiceTest'
import VoiceSliders from '~/components/settings/voice/VoiceSliders.vue'
import VoiceCacheSection from '~/components/settings/voice/VoiceCacheSection.vue'

const { t } = useI18n()
const settingsStore = useSettingsStore()

const {
  browserVoices,
  isLoadingVoices,
  isUsingFallbackVoices,
  loadTtsVoices,
  loadBrowserVoices,
  russianTtsVoices,
} = useVoiceLoader()

const selectedTtsVoice = computed<string>(() =>
  settingsStore.yandexVoice || String(russianTtsVoices.value[0]?.value || 'alena'),
)
const selectedBrowserVoice = computed<string>(() => settingsStore.voiceUri || '')
const hasSpeechSynthesis = ref(false)
let removeVoicesChangedListener: (() => void) | null = null

const ensureDefaultBrowserVoice = () => {
  if (settingsStore.yandex || settingsStore.voiceUri) return
  const firstVoiceUri = browserVoices.value[0]?.voiceURI
  if (firstVoiceUri) {
    settingsStore.setVoiceSettings({ voiceUri: firstVoiceUri })
  }
}

const ensureDefaultTtsVoice = () => {
  if (!settingsStore.yandex) return
  const available = russianTtsVoices.value
  if (!available.length) return
  const currentVoice = settingsStore.yandexVoice
  const hasCurrent = currentVoice
    ? available.some(voice => String(voice.value) === currentVoice)
    : false
  if (!hasCurrent) {
    settingsStore.setVoiceSettings({ yandexVoice: String(available[0].value) })
  }
}

const handleTtsVoiceChange = (voice: string) => {
  settingsStore.setVoiceSettings({ yandexVoice: voice })
}

const handleBrowserVoiceChange = (uri: string) => {
  settingsStore.setVoiceSettings({ voiceUri: uri })
}

onMounted(async () => {
  await loadTtsVoices()
  ensureDefaultTtsVoice()

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  hasSpeechSynthesis.value = true
  const handleVoicesChanged = () => {
    loadBrowserVoices()
    ensureDefaultBrowserVoice()
  }

  loadBrowserVoices()
  ensureDefaultBrowserVoice()
  speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
  removeVoicesChangedListener = () => {
    speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
  }
})

onBeforeUnmount(() => {
  removeVoicesChangedListener?.()
  removeVoicesChangedListener = null
})

watch(() => settingsStore.yandex, (isYandex) => {
  if (isYandex) {
    ensureDefaultTtsVoice()
    return
  }
  ensureDefaultBrowserVoice()
})

watch(russianTtsVoices, () => {
  ensureDefaultTtsVoice()
})
</script>

<template>
  <VCard class="settings-card">
    <VCardTitle class="settings-card-title">{{ t('settings.voiceSettings.title') }}</VCardTitle>
    <VCardText class="settings-card-content">
      <VSwitch
        :model-value="settingsStore.yandex"
        :label="t('settings.voiceSettings.yandexTTS')"
        color="primary"
        class="mb-4"
        @update:model-value="settingsStore.setYandexTTS(Boolean($event))"
      />

      <template v-if="settingsStore.yandex">
        <VSelect
          :model-value="selectedTtsVoice"
          :items="russianTtsVoices"
          :label="t('settings.voiceSettings.selectVoice')"
          :loading="isLoadingVoices"
          item-title="title"
          item-value="value"
          class="mb-4"
          @update:model-value="handleTtsVoiceChange"
        />
        <VAlert
          v-if="isUsingFallbackVoices"
          type="info"
          variant="tonal"
          density="comfortable"
          class="mb-4"
        >
          {{ t('settings.voiceSettings.fallbackVoices') }}
        </VAlert>
      </template>
      <template v-else>
        <VSelect
          v-if="hasSpeechSynthesis"
          :model-value="selectedBrowserVoice"
          :items="browserVoices"
          :label="t('settings.voiceSettings.selectVoice')"
          item-title="name"
          item-value="voiceURI"
          class="mb-4"
          @update:model-value="handleBrowserVoiceChange"
        />
        <VAlert
          v-else
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          {{ t('settings.voiceSettings.speechSynthesisUnavailable') }}
        </VAlert>
      </template>

      <VoiceSliders
        :selected-tts-voice="selectedTtsVoice"
        :selected-browser-voice="selectedBrowserVoice"
      />

      <VoiceCacheSection />
    </VCardText>
  </VCard>
</template>

<style scoped>
.settings-card {
  max-width: 700px;
  margin: 0 auto;
}

.settings-card-title {
  font-size: 1.1rem;
  padding: 16px 20px 12px;
}

.settings-card-content {
  padding: 0 20px 20px;
}

.settings-card-content :deep(.v-switch) {
  margin-bottom: 0;
}

.settings-card-content :deep(.v-input--density-default) {
  --v-input-control-height: 40px;
}
</style>
