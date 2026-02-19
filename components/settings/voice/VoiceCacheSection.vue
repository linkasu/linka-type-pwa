<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useTTS } from '~/composables/useTTS'
import type { TtsCacheInfo } from '~/utils/ttsCache'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const {
  getCacheInfo,
  clearCache,
  setCacheEnabled,
  setCacheSizeLimitMb,
} = useTTS()

const cacheInfo = ref<TtsCacheInfo | null>(null)
const isClearingCache = ref(false)
const cacheSizeLimit = ref(500)

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

onMounted(async () => {
  await loadCacheInfo()
})

watch(() => settingsStore.yandex, (isYandex) => {
  if (isYandex) {
    void loadCacheInfo()
  }
})
</script>

<template>
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
</template>

<style scoped>
.cache-section {
  padding-top: 8px;
}

.cache-stats {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 12px;
  border-radius: 8px;
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
