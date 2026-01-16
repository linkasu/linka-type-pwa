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
const showResetDialog = ref(false)
const resetEmail = ref('')
const resetMessage = ref('')
const resetError = ref('')
const isResetting = ref(false)

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
    await userStore.fetchState()
    
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

const openResetDialog = () => {
  resetEmail.value = email.value
  resetMessage.value = ''
  resetError.value = ''
  showResetDialog.value = true
}

const handleReset = async () => {
  if (!resetEmail.value || !/.+@.+\..+/.test(resetEmail.value)) {
    resetError.value = t('auth.resetPasswordInvalidEmail')
    return
  }

  isResetting.value = true
  resetError.value = ''
  resetMessage.value = ''

  try {
    await authStore.resetPassword(resetEmail.value)
    resetMessage.value = t('auth.resetPasswordSent')
  } catch (err: unknown) {
    const error = err as Error
    resetError.value = error.message || t('auth.resetPasswordError')
  } finally {
    isResetting.value = false
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
        @click="openResetDialog"
      >
        {{ t('auth.forgotPassword') }}
      </VBtn>
      <VBtn
        variant="text"
        color="primary"
        size="small"
        class="ml-2"
        @click="navigateTo('/register')"
      >
        {{ t('auth.register') }}
      </VBtn>
    </div>

    <VDialog v-model="showResetDialog" max-width="420">
      <VCard>
        <VCardTitle>{{ t('auth.resetPasswordTitle') }}</VCardTitle>
        <VCardText>
          <div class="text-body-2 mb-4">{{ t('auth.resetPasswordDescription') }}</div>

          <VAlert
            v-if="resetMessage"
            type="success"
            variant="tonal"
            class="mb-3"
          >
            {{ resetMessage }}
          </VAlert>

          <VAlert
            v-if="resetError"
            type="error"
            variant="tonal"
            class="mb-3"
          >
            {{ resetError }}
          </VAlert>

          <VTextField
            v-model="resetEmail"
            :label="t('auth.email')"
            type="email"
            prepend-inner-icon="mdi-email"
            autocomplete="email"
          />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn
            variant="text"
            color="secondary"
            @click="showResetDialog = false"
          >
            {{ t('actions.cancel') }}
          </VBtn>
          <VBtn
            color="primary"
            :loading="isResetting"
            @click="handleReset"
          >
            {{ t('auth.resetPasswordSend') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VForm>
</template>
