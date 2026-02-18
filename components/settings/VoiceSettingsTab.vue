<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useVoiceTest, useVoiceLoader } from '~/composables/useVoiceTest'
import { useTTS } from '~/composables/useTTS'
import type { TtsCacheInfo } from '~/utils/ttsCache'

const { t } = useI18n()
const settingsStore = useSettingsStore()

const { isTestingVoice, testVoice } = useVoiceTest()
const {
  browserVoices,
  isLoadingVoices,
  isUsingFallbackVoices,
  loadTtsVoices,
  loadBrowserVoices,
  russianTtsVoices,
} = useVoiceLoader()

const {
  getCacheInfo,
  clearCache,
  getCacheEnabled,
  setCacheEnabled,
  setCacheSizeLimitMb,
} = useTTS()

const selectedTtsVoice = computed<string>(() =>
  settingsStore.yandexVoice || String(russianTtsVoices.value[0]?.value || 'alena'),
)
const selectedBrowserVoice = computed<string>(() => settingsStore.voiceUri || '')
const hasSpeechSynthesis = ref(false)

// TTS Cache state
const cacheInfo = ref<TtsCacheInfo | null>(null)
const isClearingCache = ref(false)
const cacheSizeLimit = ref(500)
let removeVoicesChangedListener: (() => void) | null = null

const loadCacheInfo = async () => {
  cacheInfo.value = await getCacheInfo()
  cacheSizeLimit.value = cacheInfo.value.sizeLimitMb
}

const handleCacheToggle = async (enabled: boolean) => {
  await setCacheEnabled(enabled)
  await loadCacheInfo()
}

const handleCacheLimitChange = async (limitMb: number) => {
  await setCacheSizeLimitMb(limitMb)
  await loadCacheInfo()
}

const handleClearCache = async () => {
  isClearingCache.value = true
  try {
    await clearCache()
    await loadCacheInfo()
  } finally {
    isClearingCache.value = false
  }
}

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
  await loadCacheInfo()

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

const handleTestVoice = () => {
  testVoice(selectedTtsVoice.value, selectedBrowserVoice.value)
}
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

      <!-- TTS Cache Section -->
      <VDivider class="my-4" />

      <div v-if="settingsStore.yandex && cacheInfo" class="cache-section">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2">{{ t('settings.voiceSettings.cache.title') }}</span>
        </div>

        <VSwitch
          :model-value="cacheInfo.enabled"
          :label="t('settings.voiceSettings.cache.enabled')"
          color="primary"
          hide-details
          class="mb-3"
          @update:model-value="handleCacheToggle($event)"
        />

        <template v-if="cacheInfo.enabled">
          <div class="cache-stats mb-3">
            <div class="d-flex justify-space-between text-body-2">
              <span>{{ t('settings.voiceSettings.cache.used') }}</span>
              <span class="font-weight-medium">
                {{ cacheInfo.sizeMb.toFixed(1) }} / {{ cacheInfo.sizeLimitMb }} MB
                ({{ cacheInfo.fileCount }} {{ t('settings.voiceSettings.cache.files') }})
              </span>
            </div>
            <VProgressLinear
              :model-value="cacheInfo.usagePercentage"
              :color="cacheInfo.isNearLimit ? 'warning' : 'primary'"
              height="6"
              rounded
              class="mt-1"
            />
          </div>

          <div class="slider-item mb-3">
            <div class="d-flex justify-space-between">
              <span class="slider-label">{{ t('settings.voiceSettings.cache.sizeLimit') }}</span>
              <span class="slider-value">{{ cacheSizeLimit }} MB</span>
            </div>
            <VSlider
              v-model="cacheSizeLimit"
              min="100"
              max="2000"
              step="100"
              hide-details
              @end="handleCacheLimitChange(cacheSizeLimit)"
            />
          </div>

          <VBtn
            color="error"
            variant="outlined"
            size="small"
            prepend-icon="mdi-delete-outline"
            :loading="isClearingCache"
            :disabled="cacheInfo.fileCount === 0"
            @click="handleClearCache"
          >
            {{ t('settings.voiceSettings.cache.clear') }}
          </VBtn>
        </template>
      </div>
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

.cache-section {
  padding-top: 8px;
}

.cache-stats {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 12px;
  border-radius: 8px;
}
</style>
