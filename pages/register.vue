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
const confirmPassword = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const emailRules = [
  (v: string) => !!v || t('auth.email') + ' обязателен',
  (v: string) => /.+@.+\..+/.test(v) || 'Некорректный email',
]

const passwordRules = [
  (v: string) => !!v || t('auth.password') + ' обязателен',
  (v: string) => v.length >= 8 || 'Минимум 8 символов',
  (v: string) => /[a-zA-Zа-яА-Я]/.test(v) || 'Должен содержать буквы',
  (v: string) => /[0-9]/.test(v) || 'Должен содержать цифры',
]

const confirmRules = [
  (v: string) => !!v || 'Подтвердите пароль',
  (v: string) => v === password.value || 'Пароли не совпадают',
]

const handleSubmit = async () => {
  if (!email.value || !password.value || password.value !== confirmPassword.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await authStore.register(email.value, password.value)
    await userStore.fetchState()

    successMessage.value = t('auth.registerSuccess')

    if (userStore.needsSetup) {
      navigateTo('/setup')
    } else {
      navigateTo('/main')
    }
  } catch (err: unknown) {
    const error = err as Error
    errorMessage.value = error.message || t('auth.loginError')
  } finally {
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

    <VAlert
      v-if="successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="successMessage = ''"
    >
      {{ successMessage }}
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
      autocomplete="new-password"
      class="mb-3"
      @click:append-inner="showPassword = !showPassword"
    />

    <VTextField
      v-model="confirmPassword"
      label="Повторите пароль"
      :type="showPassword ? 'text' : 'password'"
      prepend-inner-icon="mdi-lock-check"
      :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
      :rules="confirmRules"
      autocomplete="new-password"
      class="mb-4"
      @click:append-inner="showPassword = !showPassword"
    />

    <VBtn
      type="submit"
      color="primary"
      size="large"
      block
      :loading="isLoading"
      :disabled="!email || !password || !confirmPassword"
    >
      {{ t('auth.register') }}
    </VBtn>

    <div class="text-center mt-4">
      <VBtn
        variant="text"
        color="primary"
        size="small"
        @click="navigateTo('/login')"
      >
        {{ t('auth.login') }}
      </VBtn>
    </div>
  </VForm>
</template>
