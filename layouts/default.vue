<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useTheme } from 'vuetify'
import PrivacyNotice from '~/components/PrivacyNotice.vue'

const settingsStore = useSettingsStore()
const theme = useTheme()

watch(
  () => settingsStore.darkTheme,
  (isDark) => {
    theme.global.name.value = isDark ? 'dark' : 'light'
  },
  { immediate: true }
)
</script>

<template>
  <VApp>
    <VMain>
      <PrivacyNotice />
      <OfflineIndicator />
      <slot />
    </VMain>
    <ConflictResolver />
  </VApp>
</template>
