<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  await authStore.initializeAuth()
  
  if (authStore.isAuthenticated) {
    router.push('/main')
  } else {
    router.push('/login')
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
