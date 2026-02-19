import {
  generateCacheKey,
  isCached,
  saveToCache,
} from './cache'

export const preloadPhrases = async (
  phrases: string[],
  voice: string,
  synthesize: (text: string, voice: string) => Promise<Blob>,
  onProgress?: (current: number, total: number) => void,
): Promise<void> => {
  const total = phrases.length

  for (let i = 0; i < phrases.length; i += 1) {
    const phrase = phrases[i]
    const cacheKey = generateCacheKey(phrase, voice)

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
