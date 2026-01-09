<script setup lang="ts">
import { useRealtimeStore } from '~/stores/realtime'

const emit = defineEmits<{
  toggleDrawer: []
  openShortcuts: []
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const realtimeStore = useRealtimeStore()

const isSettingsRoute = computed(() => route.path.startsWith('/settings'))
const settingsLabel = computed(() =>
  isSettingsRoute.value ? t('nav.backToMain') : t('nav.settings'),
)

const handleSettingsClick = () => {
  router.push(isSettingsRoute.value ? '/main' : '/settings')
}
</script>

<template>
  <VAppBar
    color="primary"
    density="comfortable"
  >
    <VAppBarNavIcon
      :aria-label="t('a11y.menuButton')"
      @click="emit('toggleDrawer')"
    />

    <VAppBarTitle>{{ t('app.name') }}</VAppBarTitle>

    <VSpacer />

    <div
      class="sync-indicator mr-2"
      :class="{ syncing: realtimeStore.isSyncing, synced: realtimeStore.isConnected }"
    >
      <VIcon
        v-if="realtimeStore.isConnected"
        size="small"
        color="success"
      >
        mdi-cloud-check
      </VIcon>
      <VIcon
        v-else-if="realtimeStore.isSyncing"
        size="small"
        color="warning"
        class="rotating"
      >
        mdi-sync
      </VIcon>
      <VIcon
        v-else
        size="small"
        color="error"
      >
        mdi-cloud-off-outline
      </VIcon>
    </div>

    <VBtn
      icon
      :aria-label="t('nav.shortcuts')"
      @click="emit('openShortcuts')"
    >
      <VIcon>mdi-keyboard</VIcon>
    </VBtn>

    <VBtn
      icon
      :aria-label="settingsLabel"
      @click="handleSettingsClick"
    >
      <VIcon>mdi-cog</VIcon>
    </VBtn>
  </VAppBar>
</template>

<style scoped>
.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
