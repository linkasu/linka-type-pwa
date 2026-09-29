import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ttsApi } from '~/api/tts'

const post = vi.fn()

vi.mock('~/api/client', () => ({
  getApiClient: () => ({ post }),
}))

const request = { text: 'hello', voice: 'alena', speed: 1 }
const audioResponse = {
  data: new ArrayBuffer(1),
  headers: { 'content-type': 'audio/mpeg' },
}
const tokenKey = 'linka.tts.installation-token.v1'
const installation = (token = 'installation-token', expiresAt = Date.now() + 48 * 60 * 60 * 1000) => ({
  token,
  expires_at: new Date(expiresAt).toISOString(),
})

const createStorage = () => {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  }
}

describe('TTS routing', () => {
  beforeEach(() => {
    post.mockReset()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.stubEnv('VITE_TTS_INSTALLATION_TOKENS_ENABLED', 'false')
  })

  it('uses the authenticated backend route first', async () => {
    post.mockResolvedValueOnce(audioResponse)

    await ttsApi.synthesize(request)

    expect(post).toHaveBeenCalledOnce()
    expect(post).toHaveBeenCalledWith('/tts', request, {
      _skipServerRetry: true,
      responseType: 'arraybuffer',
      timeout: 120000,
    })
  })

  it('falls back to direct TTS only when the backend does not support the route', async () => {
    post.mockRejectedValueOnce({ status: 404 }).mockResolvedValueOnce(audioResponse)

    await ttsApi.synthesize(request)

    expect(post).toHaveBeenCalledTimes(2)
    expect(post.mock.calls[1][0]).toBe('https://tts.linka.su/tts')
    expect(post.mock.calls[1][2]).toMatchObject({
      _skipAuth: true,
      _skipServerRetry: true,
      responseType: 'arraybuffer',
      timeout: 120000,
    })
  })

  it('does not make a direct request after an ambiguous backend error', async () => {
    const networkError = new Error('Network Error')
    post.mockRejectedValueOnce(networkError)

    await expect(ttsApi.synthesize(request)).rejects.toBe(networkError)

    expect(post).toHaveBeenCalledOnce()
  })

  it('bootstraps and stores an anonymous installation token', async () => {
    const storage = createStorage()
    vi.stubEnv('VITE_TTS_INSTALLATION_TOKENS_ENABLED', 'true')
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('crypto', { randomUUID: () => 'request-id' })
    const token = installation()
    post.mockResolvedValueOnce({ data: token }).mockResolvedValueOnce(audioResponse)

    await ttsApi.synthesize(request)

    expect(post).toHaveBeenNthCalledWith(1, '/tts/installations', {}, {
      _skipAuth: true,
      _skipServerRetry: true,
    })
    expect(post).toHaveBeenNthCalledWith(2, '/tts/anonymous', request, expect.objectContaining({
      _skipAuth: true,
      _skipServerRetry: true,
      responseType: 'arraybuffer',
      timeout: 120000,
      headers: {
        'X-TTS-Installation-Token': 'installation-token',
        'Idempotency-Key': 'request-id',
      },
    }))
    expect(JSON.parse(storage.getItem(tokenKey)!)).toEqual(token)
  })

  it('reuses a valid stored token', async () => {
    const storage = createStorage()
    storage.setItem(tokenKey, JSON.stringify(installation('stored-token')))
    vi.stubEnv('VITE_TTS_INSTALLATION_TOKENS_ENABLED', 'true')
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('crypto', { randomUUID: () => 'request-id' })
    post.mockResolvedValueOnce(audioResponse)

    await ttsApi.synthesize(request)

    expect(post).toHaveBeenCalledOnce()
    expect(post).toHaveBeenCalledWith('/tts/anonymous', request, expect.objectContaining({
      headers: expect.objectContaining({ 'X-TTS-Installation-Token': 'stored-token' }),
    }))
  })

  it('refreshes a token that expires within 24 hours', async () => {
    const storage = createStorage()
    storage.setItem(tokenKey, JSON.stringify(installation('expiring-token', Date.now() + 23 * 60 * 60 * 1000)))
    vi.stubEnv('VITE_TTS_INSTALLATION_TOKENS_ENABLED', 'true')
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('crypto', { randomUUID: () => 'request-id' })
    post.mockResolvedValueOnce({ data: installation('fresh-token') }).mockResolvedValueOnce(audioResponse)

    await ttsApi.synthesize(request)

    expect(post.mock.calls[0][0]).toBe('/tts/installations')
    expect(post.mock.calls[1][2].headers['X-TTS-Installation-Token']).toBe('fresh-token')
  })

  it('refreshes exactly once after anonymous 401 and keeps the idempotency key', async () => {
    const storage = createStorage()
    storage.setItem(tokenKey, JSON.stringify(installation('stale-token')))
    vi.stubEnv('VITE_TTS_INSTALLATION_TOKENS_ENABLED', 'true')
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('crypto', { randomUUID: () => 'request-id' })
    post.mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ data: installation('fresh-token') })
      .mockResolvedValueOnce(audioResponse)

    await ttsApi.synthesize(request)

    expect(post).toHaveBeenCalledTimes(3)
    expect(post.mock.calls[1][0]).toBe('/tts/installations')
    expect(post.mock.calls[0][2].headers['Idempotency-Key']).toBe('request-id')
    expect(post.mock.calls[2][2].headers['Idempotency-Key']).toBe('request-id')
  })

  it('uses the legacy compatibility flow after anonymous 404', async () => {
    const storage = createStorage()
    vi.stubEnv('VITE_TTS_INSTALLATION_TOKENS_ENABLED', 'true')
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('crypto', { randomUUID: () => 'request-id' })
    post.mockResolvedValueOnce({ data: installation() })
      .mockRejectedValueOnce({ status: 404 })
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce(audioResponse)

    await ttsApi.synthesize(request)

    expect(post.mock.calls.map(([url]) => url)).toEqual([
      '/tts/installations',
      '/tts/anonymous',
      '/tts',
      'https://tts.linka.su/tts',
    ])
  })

  it('does not use direct TTS after an anonymous 5xx response', async () => {
    const storage = createStorage()
    const error = { status: 500 }
    vi.stubEnv('VITE_TTS_INSTALLATION_TOKENS_ENABLED', 'true')
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('crypto', { randomUUID: () => 'request-id' })
    post.mockResolvedValueOnce({ data: installation() }).mockRejectedValueOnce(error)

    await expect(ttsApi.synthesize(request)).rejects.toBe(error)

    expect(post).toHaveBeenCalledTimes(2)
  })

  it('uses the unchanged legacy flow when localStorage is unavailable', async () => {
    vi.stubEnv('VITE_TTS_INSTALLATION_TOKENS_ENABLED', 'true')
    vi.stubGlobal('localStorage', undefined)
    post.mockResolvedValueOnce(audioResponse)

    await ttsApi.synthesize(request)

    expect(post).toHaveBeenCalledWith('/tts', request, {
      _skipServerRetry: true,
      responseType: 'arraybuffer',
      timeout: 120000,
    })
  })
})
