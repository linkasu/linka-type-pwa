<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'

const { t, setLocale } = useI18n()
const settingsStore = useSettingsStore()

const handleLocaleChange = (newLocale: 'ru' | 'en') => {
  setLocale(newLocale)
  settingsStore.setLocale(newLocale)
}
</script>

<template>
  <VCard class="pa-4">
    <VCardTitle>{{ t('settings.adaptiveSettings.title') }}</VCardTitle>
    <VCardText>
      <VSwitch
        :model-value="settingsStore.showPredictor"
        :label="t('settings.adaptiveSettings.showPredictor')"
        color="primary"
        @update:model-value="settingsStore.updateSettings({ showPredictor: $event })"
      />

      <VSwitch
        :model-value="settingsStore.showQuickes"
        :label="t('settings.adaptiveSettings.showQuickes')"
        color="primary"
        @update:model-value="settingsStore.updateSettings({ showQuickes: $event })"
      />

      <VSwitch
        :model-value="settingsStore.showBank"
        :label="t('settings.adaptiveSettings.showBank')"
        color="primary"
        @update:model-value="settingsStore.updateSettings({ showBank: $event })"
      />

      <VDivider class="my-4" />

      <VSwitch
        :model-value="settingsStore.saveOnSay"
        :label="t('settings.adaptiveSettings.saveOnSay')"
        color="primary"
        @update:model-value="settingsStore.updateSettings({ saveOnSay: $event })"
      />

      <VSwitch
        :model-value="settingsStore.typeSound"
        :label="t('settings.adaptiveSettings.typeSound')"
        color="primary"
        @update:model-value="settingsStore.updateSettings({ typeSound: $event })"
      />

      <VSwitch
        :model-value="settingsStore.speakLastWord"
        :label="t('settings.adaptiveSettings.speakLastWord')"
        color="primary"
        @update:model-value="settingsStore.updateSettings({ speakLastWord: $event })"
      />

      <VDivider class="my-4" />

      <VSwitch
        :model-value="settingsStore.darkTheme"
        :label="t('settings.adaptiveSettings.darkTheme')"
        color="primary"
        @update:model-value="settingsStore.toggleDarkTheme()"
      />

      <VSelect
        :model-value="settingsStore.locale"
        :items="[
          { title: 'Русский', value: 'ru' },
          { title: 'English', value: 'en' },
        ]"
        label="Язык / Language"
        class="mt-4"
        @update:model-value="handleLocaleChange"
      />
    </VCardText>
  </VCard>
</template>

