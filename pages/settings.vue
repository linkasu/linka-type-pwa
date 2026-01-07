<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'

definePageMeta({
  layout: 'app',
  middleware: ['auth'],
})

const { t } = useI18n()
const settingsStore = useSettingsStore()

const activeTab = ref('voice')

onMounted(() => {
  settingsStore.loadFromStorage()
})
</script>

<template>
  <VContainer
    fluid
    class="pa-4"
  >
    <div class="text-h5 mb-4">
      {{ t('settings.title') }}
    </div>

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
  </VContainer>
</template>
