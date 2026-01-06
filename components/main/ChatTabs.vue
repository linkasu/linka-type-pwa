<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  showMode: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  closeSpotlight: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="d-flex align-center mb-4">
    <VBtnToggle
      :model-value="props.modelValue"
      mandatory
      density="compact"
      color="primary"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <VBtn
        v-for="i in 3"
        :key="i"
        :value="i - 1"
        size="small"
        :aria-label="`${t('main.chat')} ${i}`"
      >
        {{ i }}
      </VBtn>
    </VBtnToggle>
    <span class="text-body-2 ml-2 text-medium-emphasis">
      {{ t('main.chat') }} {{ props.modelValue + 1 }}
    </span>
    <VSpacer />
    <VBtn
      v-if="props.showMode"
      icon
      size="small"
      variant="text"
      @click="emit('closeSpotlight')"
    >
      <VIcon>mdi-fullscreen-exit</VIcon>
    </VBtn>
  </div>
</template>

