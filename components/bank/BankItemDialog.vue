<script setup lang="ts">
import type { Category, Statement } from '~/types/api'

const props = defineProps<{
  modelValue: boolean
  mode: 'add' | 'edit'
  isCategory: boolean
  editingItem?: Category | Statement | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [text: string]
}>()

const { t } = useI18n()

const itemText = ref('')

watch(() => props.modelValue, (open) => {
  if (open && props.mode === 'edit' && props.editingItem) {
    itemText.value = 'label' in props.editingItem ? props.editingItem.label : props.editingItem.text
  } else if (open && props.mode === 'add') {
    itemText.value = ''
  }
})

const dialogTitle = computed(() => {
  if (props.mode === 'add') {
    return props.isCategory ? t('bank.addCategory') : t('bank.addStatement')
  }
  return props.isCategory ? t('bank.editCategory') : t('bank.editStatement')
})

const fieldLabel = computed(() => {
  if (props.mode === 'add') {
    return props.isCategory ? t('bank.newCategoryName') : t('bank.newStatementText')
  }
  return props.isCategory ? t('bank.categoryName') : t('bank.statementText')
})

const handleSave = () => {
  if (!itemText.value.trim()) return
  emit('save', itemText.value)
  emit('update:modelValue', false)
  itemText.value = ''
}

const handleClose = () => {
  emit('update:modelValue', false)
  itemText.value = ''
}
</script>

<template>
  <VDialog
    :model-value="props.modelValue"
    max-width="400"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle>{{ dialogTitle }}</VCardTitle>
      <VCardText>
        <VTextField
          v-model="itemText"
          :label="fieldLabel"
          autofocus
          @keydown.enter="handleSave"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          @click="handleClose"
        >
          {{ t('actions.cancel') }}
        </VBtn>
        <VBtn
          color="primary"
          :disabled="!itemText.trim()"
          @click="handleSave"
        >
          {{ props.mode === 'add' ? t('actions.add') : t('actions.save') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

