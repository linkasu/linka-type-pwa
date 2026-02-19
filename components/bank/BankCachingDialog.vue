<script setup lang="ts">
defineProps<{
  isCaching: boolean
  cachingProgress: number
  cachingTotal: number
  cachingCategoryName: string
}>()

const { t } = useI18n()
</script>

<template>
  <VDialog
    :model-value="isCaching"
    persistent
    max-width="400"
  >
    <VCard class="pa-4">
      <VCardTitle class="text-h6">
        {{ t('bank.cachingTitle') }}
      </VCardTitle>
      <VCardText>
        <div class="text-body-2 mb-2">
          {{ cachingCategoryName }}
        </div>
        <VProgressLinear
          :model-value="cachingTotal > 0 ? (cachingProgress / cachingTotal) * 100 : 0"
          color="primary"
          height="8"
          rounded
        />
        <div class="text-caption text-center mt-2">
          {{ cachingProgress }} / {{ cachingTotal }}
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>
