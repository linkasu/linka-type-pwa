import { getAppMode, isOffline } from '~/utils/offline'

const memoryStorage = new Map<string, string>()

const localStorageMock = {
  getItem: (key: string) => memoryStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memoryStorage.set(key, value)
  },
  removeItem: (key: string) => {
    memoryStorage.delete(key)
  },
  clear: () => {
    memoryStorage.clear()
  },
}

describe('offline mode utility', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: globalThis,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true },
      configurable: true,
    })
    localStorageMock.clear()
  })

  it('returns offline when explicit mode is selected', () => {
    localStorage.setItem('linka_mode', 'offline')
    expect(getAppMode()).toBe('offline')
    expect(isOffline()).toBe(true)
  })

  it('returns online/null mode when not selected', () => {
    expect(getAppMode()).toBeNull()
  })
})
