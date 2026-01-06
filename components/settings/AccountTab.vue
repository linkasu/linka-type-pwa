<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <VCard class="pa-4">
    <VCardTitle>{{ t('settings.accountSettings.title') }}</VCardTitle>
    <VCardText>
      <AccountSettings />
    </VCardText>
  </VCard>
</template>

