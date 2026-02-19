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
const activeChat = useSharedState<number>('activeChat', () => 0)

const isMainRoute = computed(() => route.path === '/main')
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

    <div
      v-if="isMainRoute"
      class="chat-toggle ml-2"
      role="group"
      :aria-label="t('main.chat')"
    >
      <VBtnToggle
        v-model="activeChat"
        mandatory
        density="compact"
      >
        <VBtn
          v-for="i in 3"
          :key="i"
          :value="i - 1"
          size="small"
          variant="text"
          :aria-label="`${t('main.chat')} ${i}`"
        >
          {{ i }}
        </VBtn>
      </VBtnToggle>
    </div>

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
.chat-toggle :deep(.v-btn) {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
}

.chat-toggle :deep(.v-btn--active) {
  background-color: rgba(255, 255, 255, 0.2);
}

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
