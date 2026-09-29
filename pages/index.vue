<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  await authStore.initializeAuth().catch((error: unknown) => {
    console.error('Failed to initialize authentication:', error)
  })
  await router.replace(authStore.isAuthenticated ? '/main' : '/login')
})
</script>

<template>
  <div class="startup-splash" role="status" aria-live="polite">
    <div class="startup-splash__mark" aria-hidden="true">L</div>
    <div class="startup-splash__copy">
      <strong>{{ $t('app.name') }}</strong>
      <span>{{ $t('app.description') }}</span>
    </div>
    <VProgressLinear indeterminate color="secondary" rounded />
  </div>
</template>

<style scoped>
.startup-splash {
  display: grid;
  place-content: center;
  gap: 20px;
  min-height: 100vh;
  padding: 32px;
  color: var(--linka-primary);
  background: linear-gradient(135deg, var(--linka-bg), color-mix(in srgb, var(--linka-secondary) 20%, var(--linka-bg)));
}

.startup-splash__mark {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  margin: 0 auto;
  border-radius: 22px;
  color: white;
  background: var(--linka-primary);
  font-size: 40px;
  font-weight: 700;
}

.startup-splash__copy {
  display: grid;
  gap: 4px;
  text-align: center;
}

.startup-splash__copy strong { font-size: 24px; }
.startup-splash__copy span { color: var(--linka-text-secondary); }
</style>
