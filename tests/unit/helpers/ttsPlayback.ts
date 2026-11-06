import { computed, readonly, ref } from 'vue'
import { createAnalyticsService } from '~/composables/analytics/service'
import { ANALYTICS_CONSENT } from '~/types/analytics'

const { settings, synthesize, getCachedAudio, download } = vi.hoisted(() => ({
  settings: { yandex: false, yandexVoice: 'alena', rate: 1, volume: 1, pitch: 1, voiceUri: '' },
  synthesize: vi.fn(), getCachedAudio: vi.fn(), download: vi.fn(),
}))
export { settings, synthesize, getCachedAudio, download }
vi.mock('~/stores/settings', () => ({ useSettingsStore: () => settings }))
vi.mock('~/utils/ttsCache', () => ({
  generateCacheKey: vi.fn(() => 'cache'), getCachedAudio,
  saveToCache: vi.fn(async () => {}), getCacheInfo: vi.fn(), clearCache: vi.fn(),
  getCacheEnabled: vi.fn(), setCacheEnabled: vi.fn(), getCacheSizeLimitMb: vi.fn(), setCacheSizeLimitMb: vi.fn(),
}))
vi.mock('~/composables/tts/yandexHelpers', () => ({ downloadAudioBlob: download, loadYandexVoiceOptions: vi.fn() }))

class Utterance {
  onstart?: () => void
  onend?: () => void
  onerror?: (event: { error: string }) => void
}
export class AudioMock {
  static instances: AudioMock[] = []
  static rejectPlay = false
  onended?: () => void
  onerror?: () => void
  onplaying?: () => void
  src = ''
  volume = 1
  pause = vi.fn()
  play = vi.fn(async () => { if (AudioMock.rejectPlay) throw new Error('private play error') })
  constructor(_url: string) { AudioMock.instances.push(this) }
}
export const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve() }

export const setupPlayback = () => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  settings.yandex = false
  AudioMock.instances = []
  AudioMock.rejectPlay = false
  const utterances: Utterance[] = []
  const record = vi.fn()
  const revoke = vi.fn()
  vi.stubGlobal('window', { speechSynthesis: {}, desktop: { privacy: { recordOutcome: record } } })
  vi.stubGlobal('speechSynthesis', { speak: (u: Utterance) => utterances.push(u), cancel: vi.fn() })
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  vi.stubGlobal('Audio', AudioMock)
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('readonly', readonly)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('onMounted', vi.fn())
  vi.stubGlobal('onUnmounted', vi.fn())
  const analytics = createAnalyticsService()
  analytics.state.value = ANALYTICS_CONSENT.Enabled
  vi.stubGlobal('useAppServices', () => ({ api: { tts: { synthesize } }, analytics }))
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:audio')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoke)
  getCachedAudio.mockResolvedValue(null)
  synthesize.mockResolvedValue(new Blob(['audio']))
  return { utterances, record, revoke, analytics }
}
