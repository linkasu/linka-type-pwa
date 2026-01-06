<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useVoiceTest, useVoiceLoader } from '~/composables/useVoiceTest'

const { t } = useI18n()
const settingsStore = useSettingsStore()

const { isTestingVoice, testVoice } = useVoiceTest()
const {
  browserVoices,
  isLoadingVoices,
  loadTtsVoices,
  loadBrowserVoices,
  russianTtsVoices,
} = useVoiceLoader()

const selectedTtsVoice = ref(settingsStore.yandexVoice || 'alena')
const selectedBrowserVoice = ref(settingsStore.voiceUri || '')

onMounted(() => {
  loadTtsVoices()
  loadBrowserVoices()
  speechSynthesis.onvoiceschanged = loadBrowserVoices

  if (!selectedBrowserVoice.value && browserVoices.value.length > 0) {
    selectedBrowserVoice.value = browserVoices.value[0].voiceURI
  }
})

watch(selectedBrowserVoice, (uri) => {
  settingsStore.setVoiceSettings({ voiceUri: uri })
})

watch(selectedTtsVoice, (voice) => {
  settingsStore.setVoiceSettings({ yandexVoice: voice })
})

const handleTestVoice = () => {
  testVoice(selectedTtsVoice.value, selectedBrowserVoice.value)
}
</script>

<template>
  <VCard class="pa-4">
    <VCardTitle>{{ t('settings.voiceSettings.title') }}</VCardTitle>
    <VCardText>
      <VSwitch
        :model-value="settingsStore.yandex"
        :label="t('settings.voiceSettings.yandexTTS')"
        color="primary"
        class="mb-4"
        @update:model-value="settingsStore.toggleYandexTTS()"
      />

      <VSelect
        v-if="settingsStore.yandex"
        v-model="selectedTtsVoice"
        :items="russianTtsVoices"
        :label="t('settings.voiceSettings.selectVoice')"
        :loading="isLoadingVoices"
        class="mb-4"
      />

      <VSelect
        v-else
        v-model="selectedBrowserVoice"
        :items="browserVoices"
        :label="t('settings.voiceSettings.selectVoice')"
        item-title="name"
        item-value="voiceURI"
        class="mb-4"
      />

      <div class="mb-4">
        <div class="d-flex justify-space-between mb-2">
          <span>{{ t('settings.voiceSettings.volume') }}</span>
          <span>{{ Math.round(settingsStore.volume * 100) }}%</span>
        </div>
        <VSlider
          :model-value="settingsStore.volume"
          min="0"
          max="1"
          step="0.1"
          :aria-label="t('a11y.volumeSlider')"
          @update:model-value="settingsStore.setVoiceSettings({ volume: $event })"
        />
      </div>

      <div class="mb-4">
        <div class="d-flex justify-space-between mb-2">
          <span>{{ t('settings.voiceSettings.rate') }}</span>
          <span>{{ settingsStore.rate.toFixed(1) }}x</span>
        </div>
        <VSlider
          :model-value="settingsStore.rate"
          min="0.5"
          max="2"
          step="0.1"
          :aria-label="t('a11y.rateSlider')"
          @update:model-value="settingsStore.setVoiceSettings({ rate: $event })"
        />
      </div>

      <div class="mb-4">
        <div class="d-flex justify-space-between mb-2">
          <span>{{ t('settings.voiceSettings.pitch') }}</span>
          <span>{{ settingsStore.pitch.toFixed(1) }}</span>
        </div>
        <VSlider
          :model-value="settingsStore.pitch"
          min="0.5"
          max="2"
          step="0.1"
          :aria-label="t('a11y.pitchSlider')"
          @update:model-value="settingsStore.setVoiceSettings({ pitch: $event })"
        />
      </div>

      <VBtn
        color="secondary"
        variant="outlined"
        prepend-icon="mdi-volume-high"
        class="mt-4"
        :loading="isTestingVoice"
        @click="handleTestVoice"
      >
        {{ t('settings.voiceSettings.test') }}
      </VBtn>
    </VCardText>
  </VCard>
</template>

