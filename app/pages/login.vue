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

const emailRules = [
  (v: string) => !!v || t('auth.email') + ' обязателен',
  (v: string) => /.+@.+\..+/.test(v) || 'Некорректный email',
]

const passwordRules = [
  (v: string) => !!v || t('auth.password') + ' обязателен',
  (v: string) => v.length >= 6 || 'Минимум 6 символов',
]

const handleSubmit = async () => {
  if (!email.value || !password.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await authStore.login(email.value, password.value)
    
    // Check if user needs setup
    let needsSetup = false
    try {
      await userStore.fetchState()
      needsSetup = userStore.needsSetup
    } catch {
      console.warn('Failed to fetch user state, assuming initialized')
    }
    
    isLoading.value = false
    
    if (needsSetup) {
      await navigateTo('/setup')
    } else {
      await navigateTo('/main')
    }
  } catch (err: unknown) {
    const error = err as Error
    errorMessage.value = error.message || t('auth.loginError')
    isLoading.value = false
  }
}
</script>

<template>
  <VForm @submit.prevent="handleSubmit">
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

    <VTextField
      v-model="email"
      :label="t('auth.email')"
      type="email"
      prepend-inner-icon="mdi-email"
      :rules="emailRules"
      autocomplete="email"
      class="mb-3"
    />

    <VTextField
      v-model="password"
      :label="t('auth.password')"
      :type="showPassword ? 'text' : 'password'"
      prepend-inner-icon="mdi-lock"
      :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
      :rules="passwordRules"
      autocomplete="current-password"
      class="mb-4"
      @click:append-inner="showPassword = !showPassword"
    />

    <VBtn
      type="submit"
      color="primary"
      size="large"
      block
      :loading="isLoading"
      :disabled="!email || !password"
    >
      {{ t('auth.login') }}
    </VBtn>

    <div class="text-center mt-4">
      <VBtn
        variant="text"
        color="primary"
        size="small"
      >
        {{ t('auth.forgotPassword') }}
      </VBtn>
    </div>
  </VForm>
</template>

