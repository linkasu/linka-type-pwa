<script setup lang="ts">
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>

<template>
  <VAlert type="error" variant="tonal" role="alert">
    {{ t('main.loadError') }}
    <template #append>
      <VBtn variant="text" @click="emit('retry')">
        {{ t('actions.retry') }}
      </VBtn>
    </template>
  </VAlert>
</template>
