<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useVoiceTest } from '~/composables/useVoiceTest'

const props = defineProps<{
  selectedTtsVoice: string
  selectedBrowserVoice: string
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
const { isTestingVoice, testVoice } = useVoiceTest()

const handleTestVoice = () => {
  testVoice(props.selectedTtsVoice, props.selectedBrowserVoice)
}
</script>

<template>
  <div class="slider-group">
    <div class="slider-item">
      <div class="d-flex justify-space-between">
        <span class="slider-label">{{ t('settings.voiceSettings.volume') }}</span>
        <span class="slider-value">{{ Math.round(settingsStore.volume * 100) }}%</span>
      </div>
      <VSlider
        :model-value="settingsStore.volume"
        min="0"
        max="1"
        step="0.1"
        hide-details
        :aria-label="t('a11y.volumeSlider')"
        @update:model-value="settingsStore.setVoiceSettings({ volume: $event })"
      />
    </div>

    <div class="slider-item">
      <div class="d-flex justify-space-between">
        <span class="slider-label">{{ t('settings.voiceSettings.rate') }}</span>
        <span class="slider-value">{{ settingsStore.rate.toFixed(1) }}x</span>
      </div>
      <VSlider
        :model-value="settingsStore.rate"
        min="0.5"
        max="2"
        step="0.1"
        hide-details
        :aria-label="t('a11y.rateSlider')"
        @update:model-value="settingsStore.setVoiceSettings({ rate: $event })"
      />
    </div>

    <div class="slider-item">
      <div class="d-flex justify-space-between">
        <span class="slider-label">{{ t('settings.voiceSettings.pitch') }}</span>
        <span class="slider-value">{{ settingsStore.pitch.toFixed(1) }}</span>
      </div>
      <VSlider
        :model-value="settingsStore.pitch"
        min="0.5"
        max="2"
        step="0.1"
        hide-details
        :aria-label="t('a11y.pitchSlider')"
        @update:model-value="settingsStore.setVoiceSettings({ pitch: $event })"
      />
    </div>
  </div>

  <VBtn
    color="secondary"
    variant="outlined"
    prepend-icon="mdi-volume-high"
    class="mt-2"
    :loading="isTestingVoice"
    @click="handleTestVoice"
  >
    {{ t('settings.voiceSettings.test') }}
  </VBtn>
</template>

<style scoped>
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 0;
}

.slider-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-label {
  font-size: 0.95rem;
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.slider-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--linka-primary, #197377);
}
</style>
