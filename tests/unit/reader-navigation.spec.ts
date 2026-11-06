import { setupPlayback } from './helpers/ttsPlayback'
import { ref } from 'vue'
import { useTTS } from '~/composables/useTTS'
import { useReaderNavigation } from '~/composables/useReaderNavigation'

describe('reader speech navigation', () => {
  afterEach(() => vi.useRealTimers())

  it('advances only after actual end; stop and errors never advance', () => {
    vi.useFakeTimers()
    const { utterances, record } = setupPlayback()
    const tts = useTTS()
    vi.stubGlobal('useTTS', () => tts)
    const statements = ref([
      { id: 'first', text: 'first', categoryId: 'category', created: 1, updated: 1 },
      { id: 'second', text: 'second', categoryId: 'category', created: 1, updated: 1 },
    ])
    const reader = useReaderNavigation({ statements, onClose: vi.fn() })
    reader.togglePlay()
    utterances[0].onstart?.()
    vi.advanceTimersByTime(1_000)
    expect(reader.currentIndex.value).toBe(0)
    reader.togglePlay()
    utterances[0].onend?.()
    vi.advanceTimersByTime(1_000)
    expect(reader.currentIndex.value).toBe(0)
    reader.togglePlay()
    utterances[1].onerror?.({ error: 'unavailable' })
    vi.advanceTimersByTime(1_000)
    expect(reader.currentIndex.value).toBe(0)
    reader.togglePlay()
    utterances[2].onend?.()
    vi.advanceTimersByTime(499)
    expect(reader.currentIndex.value).toBe(0)
    vi.advanceTimersByTime(1)
    expect(reader.currentIndex.value).toBe(1)
    expect(record).not.toHaveBeenCalled()
  })
})
