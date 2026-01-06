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

const canDelete = computed(() => deleteConfirmText.value === 'DELETE')

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
  <div>
    <div class="mb-6">
      <div class="text-subtitle-2 text-medium-emphasis">
        {{ t('settings.accountSettings.email') }}
      </div>
      <div class="text-body-1">
        {{ authStore.currentUser?.email || '-' }}
      </div>
    </div>

    <VDivider class="mb-6" />

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

    <VBtn
      color="error"
      variant="outlined"
      prepend-icon="mdi-delete"
      block
      @click="showDeleteDialog = true"
    >
      {{ t('settings.accountSettings.deleteAccount') }}
    </VBtn>

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

