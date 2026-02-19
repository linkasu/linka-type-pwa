import type { AppMode, AuthStoreContext } from './types'
import {
  applyStoredAuth,
  buildOfflineUser,
  getOrCreateDeviceId,
  loadAuthFromStorage,
  saveAuthToStorage,
  clearAuthStorage,
} from './storage'

let initializePromise: Promise<boolean> | null = null

export const initializeAuthAction = async (store: AuthStoreContext) => {
  if (store.initialized) return store.isAuthenticated

  if (initializePromise) {
    return initializePromise
  }

  initializePromise = (async () => {
    try {
      store.loadFromStorage()

      if (!store.deviceId) {
        store.deviceId = getOrCreateDeviceId()
      }

      if (store.mode === 'offline') {
        if (!store.user) {
          store.user = buildOfflineUser(store.deviceId)
        }
        store.token = null
        store.initialized = true
        store.saveToStorage()
        return store.isAuthenticated
      }

      if (store.mode === 'online' && navigator.onLine) {
        await store.refreshToken().catch(() => false)
      }

      store.initialized = true
      store.saveToStorage()
      return store.isAuthenticated
    } finally {
      initializePromise = null
    }
  })()

  return initializePromise
}

export const setModeAction = async (store: AuthStoreContext, mode: AppMode) => {
  store.mode = mode

  if (!store.deviceId) {
    store.deviceId = getOrCreateDeviceId()
  }

  if (mode === 'offline') {
    store.token = null
    if (!store.user) {
      store.user = buildOfflineUser(store.deviceId)
    }
  }

  if (mode === 'online') {
    store.token = null
  }

  store.initialized = true
  store.saveToStorage()
}

export const loadFromStorageAction = (store: AuthStoreContext) => {
  const snapshot = loadAuthFromStorage()
  applyStoredAuth(store, snapshot)
}

export const saveToStorageAction = (store: AuthStoreContext) => {
  saveAuthToStorage({
    user: store.user,
    token: store.token,
    mode: store.mode,
    deviceId: store.deviceId,
  })
}

export const clearStorageAction = () => {
  clearAuthStorage()
}
