<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <VCard class="settings-card">
    <VCardTitle class="settings-card-title">{{ t('settings.importSettings.title') }}</VCardTitle>
    <VCardText class="settings-card-content">
      <GlobalImport />
    </VCardText>
  </VCard>
</template>

<style scoped>
.settings-card {
  max-width: 700px;
  margin: 0 auto;
}

.settings-card-title {
  font-size: 1.1rem;
  padding: 16px 20px 12px;
}

.settings-card-content {
  padding: 0 20px 20px;
}
</style>

