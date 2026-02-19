<script setup lang="ts">
const props = defineProps<{
  isDeleting: boolean
}>()

const emit = defineEmits<{
  logout: []
  deleteAccount: []
}>()

const { t } = useI18n()
const showDeleteDialog = ref(false)
const deleteConfirmText = ref('')
const canDelete = computed(() => deleteConfirmText.value === 'DELETE')

const closeDialog = () => {
  showDeleteDialog.value = false
}

const requestDelete = () => {
  if (!canDelete.value) return
  emit('deleteAccount')
}

watch(() => props.isDeleting, (isDeleting) => {
  if (!isDeleting) {
    closeDialog()
    deleteConfirmText.value = ''
  }
})
</script>

<template>
  <VBtn
    color="primary"
    variant="outlined"
    prepend-icon="mdi-logout"
    class="mb-4"
    block
    @click="emit('logout')"
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
          @click="closeDialog"
        >
          {{ t('actions.cancel') }}
        </VBtn>
        <VBtn
          color="error"
          :disabled="!canDelete"
          :loading="isDeleting"
          @click="requestDelete"
        >
          {{ t('actions.delete') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.danger-zone-content {
  padding: 14px;
}
</style>
