<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useTheme } from 'vuetify'

const settingsStore = useSettingsStore()
const theme = useTheme()

watch(
  () => settingsStore.darkTheme,
  (isDark) => {
    theme.global.name = isDark ? 'dark' : 'light'
  },
  { immediate: true }
)
</script>

<template>
  <VMain>
    <slot />
  </VMain>
</template>

