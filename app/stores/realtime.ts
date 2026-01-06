import { defineStore } from 'pinia'
import type { RealtimeChange, ChangeType } from '../types/api'

interface RealtimeState {
  isConnected: boolean
  isSyncing: boolean
  cursor: string | null
  lastSyncTime: number | null
  pendingChanges: RealtimeChange[]
  reconnectAttempts: number
}

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY_BASE = 1000

export const useRealtimeStore = defineStore('realtime', {
  state: (): RealtimeState => ({
    isConnected: false,
    isSyncing: false,
    cursor: null,
    lastSyncTime: null,
    pendingChanges: [],
    reconnectAttempts: 0,
  }),

  getters: {
    hasPendingChanges: (state) => state.pendingChanges.length > 0,
  },

  actions: {
    setConnected(connected: boolean) {
      this.isConnected = connected
      if (connected) {
        this.reconnectAttempts = 0
      }
    },

    setSyncing(syncing: boolean) {
      this.isSyncing = syncing
    },

    setCursor(cursor: string) {
      this.cursor = cursor
      if (import.meta.client) {
        localStorage.setItem('realtime_cursor', cursor)
      }
    },

    loadCursor() {
      if (import.meta.client) {
        this.cursor = localStorage.getItem('realtime_cursor')
      }
    },

    updateLastSyncTime() {
      this.lastSyncTime = Date.now()
    },

    addPendingChange(change: RealtimeChange) {
      this.pendingChanges.push(change)
    },

    clearPendingChanges() {
      this.pendingChanges = []
    },

    processChange(change: RealtimeChange) {
      const { useCategoriesStore } = require('./categories')
      const { useStatementsStore } = require('./statements')
      const { useQuickesStore } = require('./quickes')
      const { useUserStore } = require('./user')

      const categoriesStore = useCategoriesStore()
      const statementsStore = useStatementsStore()
      const quickesStore = useQuickesStore()
      const userStore = useUserStore()

      switch (change.type as ChangeType) {
        case 'category_added':
        case 'category_updated':
          categoriesStore.updateCategory(change.data as import('~/types/api').Category)
          break
        case 'category_deleted':
          categoriesStore.removeCategory((change.data as { id: string }).id)
          break
        case 'statement_added':
        case 'statement_updated':
          statementsStore.updateStatement(change.data as import('~/types/api').Statement)
          break
        case 'statement_deleted':
          statementsStore.removeStatement((change.data as { id: string }).id)
          break
        case 'quickes_updated':
          quickesStore.setQuickes((change.data as import('~/types/api').QuickPhrase).quickes)
          break
        case 'user_state_updated':
          userStore.updateState(change.data as import('~/types/api').UserState)
          break
      }

      this.updateLastSyncTime()
    },

    incrementReconnectAttempts() {
      this.reconnectAttempts++
    },

    getReconnectDelay(): number {
      return Math.min(
        RECONNECT_DELAY_BASE * Math.pow(2, this.reconnectAttempts),
        30000
      )
    },

    shouldReconnect(): boolean {
      return this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS
    },

    reset() {
      this.isConnected = false
      this.isSyncing = false
      this.pendingChanges = []
      this.reconnectAttempts = 0
    },
  },
})

