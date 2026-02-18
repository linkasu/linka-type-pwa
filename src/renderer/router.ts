import { createRouter, createWebHashHistory } from 'vue-router'
import IndexPage from '~/pages/index.vue'
import LoginPage from '~/pages/login.vue'
import RegisterPage from '~/pages/register.vue'
import MainPage from '~/pages/main.vue'
import SettingsPage from '~/pages/settings.vue'
import SetupPage from '~/pages/setup.vue'
import ChatPage from '~/pages/chat.vue'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { isOffline } from '~/utils/offline'

type MiddlewareName = 'auth' | 'setup'

const routes = [
  { path: '/', name: 'index', component: IndexPage, meta: { layout: false } },
  { path: '/login', name: 'login', component: LoginPage, meta: { layout: 'auth' } },
  { path: '/register', name: 'register', component: RegisterPage, meta: { layout: 'auth' } },
  {
    path: '/main',
    name: 'main',
    component: MainPage,
    meta: { layout: 'app', middleware: ['auth', 'setup'] as MiddlewareName[] },
  },
  {
    path: '/chat',
    name: 'chat',
    component: ChatPage,
    meta: { layout: 'app', middleware: ['auth', 'setup'] as MiddlewareName[] },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage,
    meta: { layout: 'app', middleware: ['auth'] as MiddlewareName[] },
  },
  {
    path: '/setup',
    name: 'setup',
    component: SetupPage,
    meta: { layout: 'default', middleware: ['auth'] as MiddlewareName[] },
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const middleware = (to.meta.middleware as MiddlewareName[] | undefined) ?? []
  if (!middleware.length) return true

  const authStore = useAuthStore()
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  if (middleware.includes('auth') && !authStore.mode) {
    if (to.path !== '/login') return '/login'
  }

  if (middleware.includes('setup')) {
    if (isOffline() || authStore.mode === 'offline') {
      return true
    }

    const userStore = useUserStore()
    if (userStore.inited === null) {
      try {
        await userStore.fetchState()
      } catch {
        return true
      }
    }

    if (userStore.needsSetup && to.path !== '/setup') {
      return '/setup'
    }
  }

  return true
})
