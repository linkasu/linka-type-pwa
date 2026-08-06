<script setup lang="ts">
const props = defineProps<{
  close: () => void
  say: () => void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="spotlight-actions">
    <VBtn
      variant="outlined"
      color="white"
      @click="props.close"
    >
      {{ t('reader.close') }}
    </VBtn>
    <VBtn
      color="primary"
      @click="props.say"
    >
      {{ t('main.say') }}
    </VBtn>
    <div class="spotlight-hint">
      Esc - {{ t('reader.close') }} | Ctrl+Enter - {{ t('main.say') }} | Ctrl+B - {{ t('reader.close') }}
    </div>
  </div>
</template>

<style scoped>
.spotlight-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 8px;
}

.spotlight-hint {
  width: 100%;
  padding: 8px 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  text-align: right;
}
</style>
