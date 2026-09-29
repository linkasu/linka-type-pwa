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

describe('TTS routing', () => {
  beforeEach(() => {
    post.mockReset()
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
})
