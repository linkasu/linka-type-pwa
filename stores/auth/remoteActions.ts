import { clearUserData } from '~/utils/offlineDb'
import type { AuthResponse } from '~/types/api'
import type { AuthStoreContext } from './types'
import { getOrCreateDeviceId } from './storage'

const applyOnlineSession = (store: AuthStoreContext, response: AuthResponse) => {
  store.mode = 'online'
  store.token = response.token
  store.user = response.user
  store.initialized = true
  store.saveToStorage()
}

export const loginAction = async (
  store: AuthStoreContext,
  email: string,
  password: string,
) => {
  store.isLoading = true
  store.error = null

  try {
    if (!store.deviceId) {
      store.deviceId = getOrCreateDeviceId()
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      throw new Error('Введите email и пароль')
    }

    const { api } = useAppServices()
    const response = await api.auth.login({
      email: trimmedEmail,
      password,
    })

    applyOnlineSession(store, response)
    const { trackLogin, setAnalyticsUserId } = useAnalytics()
    setAnalyticsUserId(response.user.id)
    trackLogin()

    return response
  } catch (err: unknown) {
    const error = err as Error
    store.error = error.message || 'Login failed'
    throw error
  } finally {
    store.isLoading = false
  }
}

export const registerAction = async (
  store: AuthStoreContext,
  email: string,
  password: string,
) => {
  store.isLoading = true
  store.error = null

  try {
    const { api } = useAppServices()
    const response = await api.auth.register({
      email: email.trim(),
      password,
    })

    applyOnlineSession(store, response)
    const { trackRegister, setAnalyticsUserId } = useAnalytics()
    setAnalyticsUserId(response.user.id)
    trackRegister()

    return response
  } catch (err: unknown) {
    const error = err as Error
    store.error = error.message || 'Registration failed'
    throw error
  } finally {
    store.isLoading = false
  }
}

export const logoutAction = async (store: AuthStoreContext) => {
  const userId = store.user?.id
  const { trackLogout, setAnalyticsUserId } = useAnalytics()
  trackLogout()
  setAnalyticsUserId(null)

  try {
    const { api } = useAppServices()
    await api.auth.logout()
  } catch {
    // Ignore logout errors.
  }

  store.token = null
  store.user = null
  store.mode = null
  store.error = null
  store.initialized = true
  store.clearStorage()

  if (userId) {
    await clearUserData(userId)
  }
}

export const resetPasswordAction = async (store: AuthStoreContext, email: string) => {
  store.isLoading = true
  store.error = null

  try {
    const { api } = useAppServices()
    await api.auth.resetPassword({ email: email.trim() })
  } catch (err: unknown) {
    const error = err as Error
    store.error = error.message || 'Password reset failed'
    throw error
  } finally {
    store.isLoading = false
  }
}

export const refreshTokenAction = async (store: AuthStoreContext) => {
  if (store.mode !== 'online') {
    return false
  }

  try {
    const { api } = useAppServices()
    const response = await api.auth.refresh()

    store.token = response.token
    store.user = response.user
    store.initialized = true
    store.saveToStorage()

    const { setAnalyticsUserId } = useAnalytics()
    setAnalyticsUserId(response.user.id)

    return true
  } catch {
    store.token = null
    store.initialized = true
    store.saveToStorage()
    return false
  }
}
