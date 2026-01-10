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
  save: [payload: { text: string; aiUse?: boolean }]
}>()

const { t } = useI18n()

const itemText = ref('')
const aiUse = ref(false)

watch(() => props.modelValue, (open) => {
  if (open && props.mode === 'edit' && props.editingItem) {
    itemText.value = 'label' in props.editingItem ? props.editingItem.label : props.editingItem.text
    aiUse.value = 'label' in props.editingItem ? props.editingItem.aiUse ?? false : false
  } else if (open && props.mode === 'add') {
    itemText.value = ''
    aiUse.value = false
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
  emit('save', {
    text: itemText.value,
    aiUse: props.isCategory ? aiUse.value : undefined,
  })
  emit('update:modelValue', false)
  itemText.value = ''
  aiUse.value = false
}

const handleClose = () => {
  emit('update:modelValue', false)
  itemText.value = ''
  aiUse.value = false
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
        <VSwitch
          v-if="props.isCategory"
          v-model="aiUse"
          :label="t('bank.aiUse')"
          color="primary"
          inset
          hide-details="auto"
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
