export interface CachedAudio {
  key: string
  voice: string
  text: string
  blob: Blob
  size: number
  createdAt: number
  lastUsedAt: number
}

export interface CacheMeta {
  id: 'settings'
  enabled: boolean
  sizeLimitMb: number
}

export interface TtsCacheInfo {
  enabled: boolean
  sizeMb: number
  sizeLimitMb: number
  fileCount: number
  usagePercentage: number
  isNearLimit: boolean
}
