import {
  generateCacheKey,
  isCached,
  saveToCache,
} from './cache'
import { getCacheEnabled } from './settings'

export const preloadPhrases = async (
  phrases: string[],
  voice: string,
  rate: number,
  synthesize: (text: string, voice: string) => Promise<Blob>,
  onProgress?: (current: number, total: number) => void,
): Promise<void> => {
  if (!(await getCacheEnabled())) return
  const total = phrases.length

  for (let i = 0; i < phrases.length; i += 1) {
    const phrase = phrases[i]
    const cacheKey = generateCacheKey(phrase, voice, rate)

    if (!(await isCached(cacheKey))) {
      try {
        const blob = await synthesize(phrase, voice)
        await saveToCache(cacheKey, phrase, voice, blob)
      } catch {
        // Continue with next phrase.
      }
    }

    onProgress?.(i + 1, total)
  }
}
