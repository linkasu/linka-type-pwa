<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <VCard class="pa-4">
    <VCardTitle>{{ t('settings.importSettings.title') }}</VCardTitle>
    <VCardText>
      <GlobalImport />
    </VCardText>
  </VCard>
</template>

