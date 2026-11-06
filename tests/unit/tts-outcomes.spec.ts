import { AudioMock, download, flush, getCachedAudio, settings, setupPlayback, synthesize } from './helpers/ttsPlayback'
import { useTTS } from '~/composables/useTTS'
import { ANALYTICS_CONSENT } from '~/types/analytics'

describe('speech terminal outcomes', () => {
  let utterances: ReturnType<typeof setupPlayback>['utterances']
  let record: ReturnType<typeof setupPlayback>['record']
  let analytics: ReturnType<typeof setupPlayback>['analytics']
  let revoke: ReturnType<typeof setupPlayback>['revoke']

  beforeEach(() => {
    ;({ utterances, record, analytics, revoke } = setupPlayback())
  })

  it('awaits native end, not start, and sends one closed outcome without text', async () => {
    const tts = useTTS()
    const onEnd = vi.fn()
    const settled = vi.fn()
    const pending = tts.speak('private phrase', { source: 'input', onEnd }).then(settled)
    utterances[0].onstart?.()
    await flush()
    expect(record).not.toHaveBeenCalled()
    expect(settled).not.toHaveBeenCalled()
    utterances[0].onend?.()
    utterances[0].onend?.()
    utterances[0].onerror?.({ error: 'private error' })
    await pending
    expect(onEnd).toHaveBeenCalledOnce()
    expect(record).toHaveBeenCalledExactlyOnceWith({ kind: 'speech_completed', result: 'completed', source: 'input', mode: 'local', count_bucket: 'six_to_twenty', duration_bucket: 'under_5s' })
  })

  it('cancels replacement once and ignores every old browser callback', async () => {
    const tts = useTTS()
    const onEnd = vi.fn()
    const onError = vi.fn()
    const old = tts.speak('old', { source: 'quick', onEnd, onError })
    utterances[0].onstart?.()
    const next = tts.speak('new', { source: 'bank' })
    utterances[1].onstart?.()
    utterances[0].onend?.()
    utterances[0].onerror?.({ error: 'late' })
    expect(tts.isPlaying.value).toBe(true)
    expect(onEnd).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    expect(record.mock.calls.map(([e]) => e.result)).toEqual(['cancelled'])
    tts.stop()
    tts.stop()
    await Promise.all([old, next])
    expect(record.mock.calls.map(([e]) => e.result)).toEqual(['cancelled', 'cancelled'])
  })

  it('resolves actual completion and onEnd when the optional IPC sink throws', async () => {
    record.mockImplementation(() => { throw new Error('IPC unavailable') })
    const onEnd = vi.fn()
    const tts = useTTS()
    const pending = tts.speak('private', { source: 'input', onEnd })
    expect(() => utterances[0].onend?.()).not.toThrow()
    await pending
    expect(onEnd).toHaveBeenCalledOnce()
    expect(record).toHaveBeenCalledOnce()
    expect(tts.isPlaying.value).toBe(false)
  })

  it('emits failure once without leaking browser errors', async () => {
    const tts = useTTS()
    const onError = vi.fn()
    const pending = tts.speak('private', { source: 'dialog', onError })
    utterances[0].onerror?.({ error: 'private-device-name' })
    utterances[0].onend?.()
    await pending
    expect(onError).toHaveBeenCalledOnce()
    expect(record).toHaveBeenCalledOnce()
    expect(record.mock.calls[0][0]).toMatchObject({ result: 'failed', failure_code: 'engine_unavailable' })
    expect(JSON.stringify(record.mock.calls)).not.toContain('private')
  })

  it('ignores a stopped cloud response even when a newer request has played', async () => {
    settings.yandex = true
    let resolveOld!: (blob: Blob) => void
    synthesize.mockImplementationOnce(() => new Promise<Blob>(resolve => { resolveOld = resolve }))
    const tts = useTTS()
    const onEnd = vi.fn()
    const old = tts.speak('old', { source: 'input', onEnd, download: true })
    await flush()
    tts.stop()
    const next = tts.speak('new', { source: 'quick' })
    await flush()
    resolveOld(new Blob(['late']))
    await flush()
    expect(AudioMock.instances).toHaveLength(1)
    expect(download).not.toHaveBeenCalled()
    expect(tts.isPlaying.value).toBe(true)
    AudioMock.instances[0].onended?.()
    await Promise.all([old, next])
    expect(onEnd).not.toHaveBeenCalled()
    expect(record.mock.calls.map(([e]) => e.result)).toEqual(['cancelled', 'completed'])
    expect(revoke).toHaveBeenCalledOnce()
  })

  it('measures cloud playback, not request latency, and ignores stale audio callbacks', async () => {
    settings.yandex = true
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    let resolve!: (blob: Blob) => void
    synthesize.mockImplementationOnce(() => new Promise<Blob>(done => { resolve = done }))
    const tts = useTTS()
    const first = tts.speak('first', { source: 'input' })
    await flush()
    now = 150_000
    resolve(new Blob(['audio']))
    await flush()
    const oldAudio = AudioMock.instances[0]
    now += 6_000
    oldAudio.onended?.()
    await first
    expect(record.mock.calls[0][0].duration_bucket).toBe('5s_to_30s')
    const next = tts.speak('next', { source: 'bank' })
    await flush()
    oldAudio.onended?.()
    oldAudio.onerror?.()
    expect(tts.isPlaying.value).toBe(true)
    tts.stop()
    await next
    expect(revoke).toHaveBeenCalledTimes(2)
  })

  it.each(['request', 'playback', 'play-rejection'] as const)('handles cloud %s failure exactly once', async (failure) => {
    settings.yandex = true
    if (failure === 'request') synthesize.mockRejectedValueOnce(new Error('private network error'))
    AudioMock.rejectPlay = failure === 'play-rejection'
    const tts = useTTS()
    const onError = vi.fn()
    const pending = tts.speak('private', { source: 'input', onError })
    await flush()
    if (failure !== 'request') {
      AudioMock.instances[0].onerror?.()
      AudioMock.instances[0].onended?.()
    }
    await pending
    expect(onError).toHaveBeenCalledOnce()
    expect(record).toHaveBeenCalledOnce()
    expect(record.mock.calls[0][0]).toMatchObject({ result: 'failed', failure_code: 'request_failed' })
    expect(JSON.stringify(record.mock.calls)).not.toContain('private')
  })

  it.each([ANALYTICS_CONSENT.Unknown, ANALYTICS_CONSENT.Disabled])('keeps consent %s gated through the facade', async (consent) => {
    analytics.state.value = consent
    const tts = useTTS()
    const pending = tts.speak('secret', { source: 'dialog' })
    utterances[0].onend?.()
    await pending
    expect(record).not.toHaveBeenCalled()
  })

  it('retains cached offline playback, download, and start/end callbacks', async () => {
    settings.yandex = true
    const blob = new Blob(['cached'])
    getCachedAudio.mockResolvedValueOnce(blob)
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const pending = useTTS().speak('cached', { source: 'bank', download: true, onStart, onEnd })
    expect(onStart).toHaveBeenCalledOnce()
    await flush()
    expect(synthesize).not.toHaveBeenCalled()
    expect(download).toHaveBeenCalledWith(blob, expect.stringMatching(/^linka-.*\.mp3$/))
    expect(onEnd).not.toHaveBeenCalled()
    AudioMock.instances[0].onended?.()
    await pending
    expect(onEnd).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledOnce()
  })

  it('fails unsupported local speech without an utterance or private metadata', async () => {
    vi.stubGlobal('window', { desktop: { privacy: { recordOutcome: record } } })
    const onError = vi.fn()
    await useTTS().speak('private', { source: 'input', onError })
    expect(utterances).toHaveLength(0)
    expect(onError).toHaveBeenCalledOnce()
    expect(record.mock.calls[0][0]).toMatchObject({ result: 'failed', failure_code: 'engine_unavailable' })
  })

  it('does not instrument empty input, automatic words, or reader callbacks', async () => {
    const tts = useTTS()
    await tts.speak(' ', { source: 'input' })
    expect(utterances).toHaveLength(0)
    tts.speakLastWord('hello world')
    utterances[0].onend?.()
    const onEnd = vi.fn()
    const reader = tts.speak('reader', { onEnd })
    utterances[1].onend?.()
    await reader
    expect(onEnd).toHaveBeenCalledOnce()
    expect(record).not.toHaveBeenCalled()
  })
})
