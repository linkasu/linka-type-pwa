<script setup lang="ts">
const props = withDefaults(defineProps<{
  warning?: boolean
  showLogin?: boolean
}>(), {
  warning: false,
  showLogin: false,
})
const emit = defineEmits<{ retry: []; login: [] }>()
const { t } = useI18n()
</script>

<template>
  <VAlert
    :type="props.warning ? 'warning' : 'error'"
    variant="tonal"
    :role="props.warning ? 'status' : 'alert'"
    :aria-live="props.warning ? 'polite' : 'assertive'"
  >
    {{ t(props.warning ? 'main.loadWarning' : 'main.loadError') }}
    <template #append>
      <VBtn variant="text" @click="emit('retry')">
        {{ t('actions.retry') }}
      </VBtn>
      <VBtn v-if="props.showLogin" variant="text" @click="emit('login')">
        {{ t('auth.login') }}
      </VBtn>
    </template>
  </VAlert>
</template>
