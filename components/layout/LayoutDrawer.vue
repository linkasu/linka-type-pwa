<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  openTutorial: []
  openShortcuts: []
}>()

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const menuItems = computed(() => [
  { title: t('nav.home'), icon: 'mdi-home', to: '/main' },
  { title: t('nav.settings'), icon: 'mdi-cog', to: '/settings' },
  { title: t('nav.tutorial'), icon: 'mdi-school', action: () => emit('openTutorial') },
  { title: t('nav.shortcuts'), icon: 'mdi-keyboard', action: () => emit('openShortcuts') },
])

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <VNavigationDrawer
    :model-value="props.modelValue"
    temporary
    @update:model-value="emit('update:modelValue', $event)"
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
</template>

