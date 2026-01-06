<script setup lang="ts">
import { useSettingsStore } from '~/stores/settings'
import { useAuthStore } from '~/stores/auth'
import { useRealtimeStore } from '~/stores/realtime'
import { useTheme } from 'vuetify'

const { t } = useI18n()
const router = useRouter()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const realtimeStore = useRealtimeStore()
const theme = useTheme()

const drawer = ref(false)
const showShortcuts = ref(false)
const showTutorial = ref(false)

watch(
  () => settingsStore.darkTheme,
  (isDark) => {
    theme.global.name = isDark ? 'dark' : 'light'
  },
  { immediate: true }
)

const menuItems = computed(() => [
  { title: t('nav.home'), icon: 'mdi-home', to: '/main' },
  { title: t('nav.settings'), icon: 'mdi-cog', to: '/settings' },
  { title: t('nav.tutorial'), icon: 'mdi-school', action: () => { showTutorial.value = true } },
  { title: t('nav.shortcuts'), icon: 'mdi-keyboard', action: () => { showShortcuts.value = true } },
])

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div>
    <VAppBar
      color="primary"
      density="comfortable"
    >
      <VAppBarNavIcon
        :aria-label="t('a11y.menuButton')"
        @click="drawer = !drawer"
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
        @click="showShortcuts = true"
      >
        <VIcon>mdi-keyboard</VIcon>
      </VBtn>

      <VBtn
        icon
        :aria-label="t('nav.settings')"
        :to="'/settings'"
      >
        <VIcon>mdi-cog</VIcon>
      </VBtn>
    </VAppBar>

    <VNavigationDrawer
      v-model="drawer"
      temporary
    >
      <VList nav>
        <VListItem
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          @click="item.action && item.action()"
        />
      </VList>

      <template #append>
        <div class="pa-4">
          <VBtn
            block
            variant="outlined"
            color="error"
            prepend-icon="mdi-logout"
            @click="handleLogout"
          >
            {{ t('auth.logout') }}
          </VBtn>
        </div>
      </template>
    </VNavigationDrawer>

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
  </div>
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

