<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useTheme } from 'vuetify'
import LayoutHeader from '~/components/layout/LayoutHeader.vue'
import LayoutDrawer from '~/components/layout/LayoutDrawer.vue'

const settingsStore = useSettingsStore()
const theme = useTheme()

const drawer = ref(false)
const showShortcuts = ref(false)
const showTutorial = ref(false)

watch(
  () => settingsStore.darkTheme,
  (isDark) => {
    theme.global.name.value = isDark ? 'dark' : 'light'
  },
  { immediate: true },
)
</script>

<template>
  <VApp>
    <LayoutHeader
      @toggle-drawer="drawer = !drawer"
      @open-shortcuts="showShortcuts = true"
    />

    <LayoutDrawer
      v-model="drawer"
      @open-tutorial="showTutorial = true"
      @open-shortcuts="showShortcuts = true"
    />

    <VMain id="main-content">
      <slot />
    </VMain>

    <ShortcutList
      v-if="showShortcuts"
      @close="showShortcuts = false"
    />

    <Tutorial
      v-if="showTutorial"
      @close="showTutorial = false"
    />

    <OfflineIndicator />

    <ConflictResolver />

    <UpdatePrompt />

    <MobileAppPrompt />
  </VApp>
</template>
