import { generateCacheKey } from '~/utils/ttsCache/cache'

describe('TTS cache keys', () => {
  it('separates cached audio by rate and cache format version', () => {
    const normal = generateCacheKey('hello', 'alena', 1)
    const slow = generateCacheKey('hello', 'alena', 0.8)

    expect(normal).toMatch(/^v2-/)
    expect(slow).not.toBe(normal)
  })
})
