<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: false,
})

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.initializeAuth()
  
  if (authStore.isAuthenticated) {
    navigateTo('/main')
  } else {
    navigateTo('/login')
  }
})
</script>

<template>
  <div class="loading-overlay">
    <VProgressCircular
      indeterminate
      color="primary"
      size="64"
    />
  </div>
</template>
