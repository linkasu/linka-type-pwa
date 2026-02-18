<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'

definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()
const authStore = useAuthStore()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showModeDialog = ref(false)
const selectedMode = ref<'online' | 'offline' | null>(null)

const canContinue = computed(() => {
  if (!selectedMode.value) return false
  if (selectedMode.value === 'offline') return true
  return Boolean(email.value.trim()) && Boolean(password.value)
})

const navigateAfterLogin = async (mode: 'online' | 'offline') => {
  if (mode === 'offline') {
    await navigateTo('/main')
    return
  }

  try {
    await userStore.fetchState()
  } catch {
    // Allow opening the app even if state endpoint is temporarily unavailable.
  }

  if (userStore.needsSetup) {
    await navigateTo('/setup')
    return
  }

  await navigateTo('/main')
}

onMounted(async () => {
  await authStore.initializeAuth()

  if (authStore.isAuthenticated) {
    await navigateAfterLogin(authStore.mode === 'offline' ? 'offline' : 'online')
    return
  }

  selectedMode.value = authStore.mode
  showModeDialog.value = !authStore.mode
})

const continueWithMode = async (mode?: 'online' | 'offline') => {
  const targetMode = mode || selectedMode.value
  if (!targetMode) {
    errorMessage.value = 'Выберите режим запуска'
    showModeDialog.value = true
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await authStore.setMode(targetMode)
    showModeDialog.value = false

    if (targetMode === 'online') {
      if (!email.value.trim() || !password.value) {
        errorMessage.value = 'Введите email и пароль для онлайн-режима'
        return
      }

      await authStore.login(email.value.trim(), password.value)
    }

    await navigateAfterLogin(targetMode)
  } catch (err: unknown) {
    const error = err as Error
    errorMessage.value = error.message || 'Не удалось инициализировать режим'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <VAlert
      type="info"
      variant="tonal"
      class="mb-4"
    >
      {{ t('app.name') }} работает офлайн без аккаунта. Для синхронизации и облачных голосов войдите в онлайн-режим.
    </VAlert>

    <VAlert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </VAlert>

    <VRadioGroup
      v-model="selectedMode"
      class="mb-4"
      inline
    >
      <VRadio value="online" label="Онлайн" />
      <VRadio value="offline" label="Офлайн" />
    </VRadioGroup>

    <div v-if="selectedMode === 'online'" class="mb-4">
      <VTextField
        v-model="email"
        :label="t('auth.email')"
        type="email"
        prepend-inner-icon="mdi-email"
        autocomplete="email"
        class="mb-3"
      />

      <VTextField
        v-model="password"
        :label="t('auth.password')"
        :type="showPassword ? 'text' : 'password'"
        prepend-inner-icon="mdi-lock"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        autocomplete="current-password"
        @click:append-inner="showPassword = !showPassword"
      />
    </div>

    <VBtn
      color="primary"
      size="large"
      block
      :loading="isLoading"
      :disabled="!canContinue"
      @click="continueWithMode()"
    >
      {{ selectedMode === 'online' ? 'Войти' : 'Продолжить' }}
    </VBtn>

    <div class="text-center mt-4">
      <VBtn
        variant="text"
        color="primary"
        size="small"
        @click="showModeDialog = true"
      >
        Изменить режим запуска
      </VBtn>
      <VBtn
        v-if="selectedMode === 'online'"
        variant="text"
        color="primary"
        size="small"
        class="ml-2"
        @click="navigateTo('/register')"
      >
        {{ t('auth.register') }}
      </VBtn>
    </div>

    <VDialog v-model="showModeDialog" max-width="520" persistent>
      <VCard>
        <VCardTitle class="text-h6">Режим при первом запуске</VCardTitle>
        <VCardText>
          <div class="text-body-2 mb-4">
            Выберите режим работы приложения. Онлайн включает синхронизацию с сервером, офлайн работает только локально.
          </div>

          <VRadioGroup v-model="selectedMode" class="mb-2">
            <VRadio value="online" label="Онлайн" />
            <VRadio value="offline" label="Офлайн" />
          </VRadioGroup>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn
            color="primary"
            :disabled="!selectedMode"
            @click="showModeDialog = false"
          >
            Подтвердить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
