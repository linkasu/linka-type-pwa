<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useAuthStore } from '~/stores/auth'

const { t, setLocale } = useI18n()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const handleLocaleChange = (newLocale: 'ru' | 'en') => {
  setLocale(newLocale)
  settingsStore.setLocale(newLocale)
}

const handleModeChange = async (mode: 'online' | 'offline' | null) => {
  if (!mode) return
  await authStore.setMode(mode)
}
</script>

<template>
  <VCard class="settings-card">
    <VCardTitle class="settings-card-title">{{ t('settings.adaptiveSettings.title') }}</VCardTitle>
    <VCardText class="settings-card-content">
      <div class="settings-section">
        <div class="settings-section-title">{{ t('settings.adaptiveSettings.title') }}</div>
        <VSwitch
          :model-value="Boolean(settingsStore.showPredictor)"
          :label="t('settings.adaptiveSettings.showPredictor')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="settingsStore.updateSettings({ showPredictor: $event })"
        />
        <VSwitch
          :model-value="Boolean(settingsStore.showSpotlightPredictor)"
          :label="t('settings.adaptiveSettings.showSpotlightPredictor')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="settingsStore.updateSettings({ showSpotlightPredictor: $event })"
        />
        <VSwitch
          :model-value="Boolean(settingsStore.showQuickes)"
          :label="t('settings.adaptiveSettings.showQuickes')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="settingsStore.updateSettings({ showQuickes: $event })"
        />
        <VSwitch
          :model-value="Boolean(settingsStore.showBank)"
          :label="t('settings.adaptiveSettings.showBank')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="settingsStore.updateSettings({ showBank: $event })"
        />
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Поведение</div>
        <VSwitch
          :model-value="Boolean(settingsStore.saveOnSay)"
          :label="t('settings.adaptiveSettings.saveOnSay')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="settingsStore.updateSettings({ saveOnSay: $event })"
        />
        <VSwitch
          :model-value="Boolean(settingsStore.typeSound)"
          :label="t('settings.adaptiveSettings.typeSound')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="settingsStore.updateSettings({ typeSound: $event })"
        />
        <VSwitch
          :model-value="Boolean(settingsStore.speakLastWord)"
          :label="t('settings.adaptiveSettings.speakLastWord')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="settingsStore.updateSettings({ speakLastWord: $event })"
        />
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Оформление</div>
        <VSwitch
          :model-value="settingsStore.darkTheme"
          :label="t('settings.adaptiveSettings.darkTheme')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="settingsStore.toggleDarkTheme()"
        />
        <VSelect
          :model-value="settingsStore.locale"
          :items="[
            { title: 'Русский', value: 'ru' },
            { title: 'English', value: 'en' },
          ]"
          label="Язык / Language"
          density="compact"
          class="mt-3"
          @update:model-value="handleLocaleChange"
        />
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Режим данных</div>
        <VRadioGroup
          :model-value="authStore.mode"
          inline
          @update:model-value="handleModeChange"
        >
          <VRadio label="Онлайн (синхронизация)" value="online" />
          <VRadio label="Офлайн (только локально)" value="offline" />
        </VRadioGroup>
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
  padding: 12px 16px 8px;
}

.settings-card-content {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-section-title {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin-bottom: 4px;
}
</style>
