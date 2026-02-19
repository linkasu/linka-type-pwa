<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const router = useRouter()

const activeTab = ref('voice')
const isInitializing = ref(true)

onMounted(async () => {
  try {
    await settingsStore.initialize()
  } finally {
    isInitializing.value = false
  }
})

const goToMain = () => {
  router.push('/main')
}
</script>

<template>
  <VContainer
    fluid
    class="pa-4"
  >
    <div class="d-flex align-center flex-wrap gap-2 mb-4">
      <VBtn
        color="primary"
        variant="tonal"
        size="large"
        prepend-icon="mdi-arrow-left"
        @click="goToMain"
      >
        {{ t('nav.backToMain') }}
      </VBtn>
      <div class="text-h5">
        {{ t('settings.title') }}
      </div>
    </div>

    <div v-if="isInitializing" class="d-flex justify-center py-8">
      <VProgressCircular indeterminate color="primary" />
    </div>
    <template v-else>
      <VTabs
        v-model="activeTab"
        color="primary"
        class="mb-4"
      >
        <VTab value="voice">
          <VIcon start>
            mdi-volume-high
          </VIcon>
          {{ t('settings.voice') }}
        </VTab>
        <VTab value="adaptive">
          <VIcon start>
            mdi-tune
          </VIcon>
          {{ t('settings.adaptive') }}
        </VTab>
        <VTab value="import">
          <VIcon start>
            mdi-download
          </VIcon>
          {{ t('settings.import') }}
        </VTab>
        <VTab value="account">
          <VIcon start>
            mdi-account
          </VIcon>
          {{ t('settings.account') }}
        </VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        <VWindowItem value="voice">
          <SettingsVoiceSettingsTab />
        </VWindowItem>

        <VWindowItem value="adaptive">
          <SettingsAdaptiveSettingsTab />
        </VWindowItem>

        <VWindowItem value="import">
          <SettingsImportTab />
        </VWindowItem>

        <VWindowItem value="account">
          <SettingsAccountTab />
        </VWindowItem>
      </VWindow>
    </template>
  </VContainer>
</template>
