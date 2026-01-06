<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useTheme } from 'vuetify'

const settingsStore = useSettingsStore()
const theme = useTheme()

watch(
  () => settingsStore.darkTheme,
  (isDark) => {
    theme.change(isDark ? 'dark' : 'light')
  },
  { immediate: true }
)
</script>

<template>
  <VApp>
    <VMain>
      <slot />
    </VMain>
  </VApp>
</template>

