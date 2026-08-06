<script setup lang="ts">
type MainSection = 'input' | 'quickes' | 'bank'

const props = defineProps<{
  modelValue: MainSection
  showQuickes: boolean
  showBank: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: MainSection]
}>()

const { t } = useI18n()
</script>

<template>
  <VTabs
    :model-value="props.modelValue"
    class="compact-section-tabs"
    color="primary"
    grow
    @update:model-value="emit('update:modelValue', $event as MainSection)"
  >
    <VTab value="input">
      <VIcon start>mdi-keyboard</VIcon>
      {{ t('main.sections.input') }}
    </VTab>
    <VTab
      v-if="props.showQuickes"
      value="quickes"
    >
      <VIcon start>mdi-lightning-bolt</VIcon>
      {{ t('main.sections.quickes') }}
    </VTab>
    <VTab
      v-if="props.showBank"
      value="bank"
    >
      <VIcon start>mdi-folder</VIcon>
      {{ t('main.sections.bank') }}
    </VTab>
  </VTabs>
</template>

<style scoped>
.compact-section-tabs {
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgb(var(--v-theme-background));
}

@media (max-width: 479px) {
  .compact-section-tabs :deep(.v-tab) {
    min-width: 0;
    padding-inline: 8px;
  }

  .compact-section-tabs :deep(.v-icon) {
    display: none;
  }
}
</style>
