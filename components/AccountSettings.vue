<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

const showDeleteDialog = ref(false)
const deleteConfirmText = ref('')
const isDeleting = ref(false)
const isSwitchingOnline = ref(false)
const modeError = ref('')

const canDelete = computed(() => deleteConfirmText.value === 'DELETE')
const isOnlineMode = computed(() => authStore.mode === 'online')
const isOnlineAuthorized = computed(() => isOnlineMode.value && Boolean(authStore.token))
const modeLabel = computed(() =>
  isOnlineMode.value
    ? t('settings.accountSettings.onlineMode')
    : t('settings.accountSettings.offlineMode'),
)

const loginOnline = async () => {
  if (isOnlineAuthorized.value) return

  isSwitchingOnline.value = true
  modeError.value = ''
  try {
    await authStore.setMode('online')
    await router.push('/login')
  } catch (err) {
    console.error('Failed to login in online mode:', err)
    modeError.value = t('settings.accountSettings.modeSwitchFailed')
  } finally {
    isSwitchingOnline.value = false
  }
}

const handleDeleteAccount = async () => {
  if (!canDelete.value) return

  isDeleting.value = true
  try {
    await userStore.deleteAccount()
    router.push('/login')
  } catch (err) {
    console.error('Failed to delete account:', err)
  } finally {
    isDeleting.value = false
    showDeleteDialog.value = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="account-settings">
    <VAlert
      v-if="!isOnlineAuthorized"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      <div class="text-subtitle-2 mb-1">{{ t('settings.accountSettings.onlinePromptTitle') }}</div>
      <div class="text-body-2 mb-2">{{ t('settings.accountSettings.onlinePromptDescription') }}</div>
      <ul class="online-benefits">
        <li>{{ t('settings.accountSettings.onlineBenefitSync') }}</li>
        <li>{{ t('settings.accountSettings.onlineBenefitBackup') }}</li>
        <li>{{ t('settings.accountSettings.onlineBenefitRecovery') }}</li>
      </ul>
      <VBtn
        color="primary"
        variant="flat"
        prepend-icon="mdi-cloud-check"
        :loading="isSwitchingOnline"
        @click="loginOnline"
      >
        {{ t('settings.accountSettings.loginOnline') }}
      </VBtn>
    </VAlert>

    <VAlert
      v-else
      type="success"
      variant="tonal"
      class="mb-4"
    >
      <div class="text-subtitle-2 mb-1">{{ t('settings.accountSettings.onlineReadyTitle') }}</div>
      <div class="text-body-2">{{ t('settings.accountSettings.onlineReadyDescription') }}</div>
    </VAlert>

    <VAlert
      v-if="modeError"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="modeError = ''"
    >
      {{ modeError }}
    </VAlert>

    <VSheet
      class="account-summary mb-5"
      rounded="lg"
      border
    >
      <div class="d-flex align-start justify-space-between flex-wrap ga-3">
        <div>
          <div class="text-subtitle-2 text-medium-emphasis">
            {{ t('settings.accountSettings.email') }}
          </div>
          <div class="text-body-1 email-value">
            {{ authStore.currentUser?.email || '-' }}
          </div>
          <div class="text-caption text-medium-emphasis mt-2">
            {{ t('settings.accountSettings.deviceId') }}:
            <span class="mono">{{ authStore.deviceId || '-' }}</span>
          </div>
        </div>
        <VChip
          :color="isOnlineMode ? 'success' : 'warning'"
          variant="tonal"
          size="small"
        >
          {{ modeLabel }}
        </VChip>
      </div>
    </VSheet>

    <template v-if="isOnlineAuthorized">
      <VBtn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-logout"
        class="mb-4"
        block
        @click="handleLogout"
      >
        {{ t('auth.logout') }}
      </VBtn>

      <VCard
        variant="tonal"
        color="error"
        class="danger-zone"
      >
        <VCardText class="danger-zone-content">
          <div class="text-subtitle-2 mb-1">
            {{ t('settings.accountSettings.dangerZoneTitle') }}
          </div>
          <div class="text-body-2 mb-3">
            {{ t('settings.accountSettings.deleteWarning') }}
          </div>
          <VBtn
            color="error"
            variant="outlined"
            prepend-icon="mdi-delete"
            block
            @click="showDeleteDialog = true"
          >
            {{ t('settings.accountSettings.deleteAccount') }}
          </VBtn>
        </VCardText>
      </VCard>
    </template>

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle class="text-error">
          {{ t('settings.accountSettings.deleteAccount') }}
        </VCardTitle>
        <VCardText>
          <VAlert
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            {{ t('settings.accountSettings.deleteWarning') }}
          </VAlert>

          <VTextField
            v-model="deleteConfirmText"
            :label="t('settings.accountSettings.confirmDelete')"
            :placeholder="'DELETE'"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showDeleteDialog = false"
          >
            {{ t('actions.cancel') }}
          </VBtn>
          <VBtn
            color="error"
            :disabled="!canDelete"
            :loading="isDeleting"
            @click="handleDeleteAccount"
          >
            {{ t('actions.delete') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.account-summary {
  padding: 14px 16px;
}

.email-value {
  word-break: break-all;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.online-benefits {
  margin: 0 0 10px;
  padding-left: 18px;
}

.danger-zone-content {
  padding: 14px;
}
</style>
