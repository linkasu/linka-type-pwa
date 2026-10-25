import { nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { syncTextareaPaste, usePredictor } from '~/composables/usePredictor'

const { completeMock, trackPredicatorUseMock } = vi.hoisted(() => ({
  completeMock: vi.fn(),
  trackPredicatorUseMock: vi.fn(),
}))

vi.mock('~/composables/useAppServices', () => ({
  useAppServices: () => ({
    api: {
      predictor: {
        complete: completeMock,
      },
    },
  }),
}))

vi.mock('~/composables/useAnalytics', () => ({
  useAnalytics: () => ({
    trackPredicatorUse: trackPredicatorUseMock,
  }),
}))

describe('usePredictor paste and sync behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    completeMock.mockReset()
    trackPredicatorUseMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches predictions immediately when pasted via syncTextareaPaste even without prior input event', async () => {
    const modelValue = ref('')
    completeMock.mockResolvedValue({ text: ['вечер', 'день'], pos: 1 })

    const predictor = usePredictor({
      modelValue: () => modelValue.value,
      onUpdateModelValue: (val) => { modelValue.value = val },
      debounceMs: 300,
    })

    const fakePasteEvent = {
      target: { tagName: 'TEXTAREA', value: 'добрый' },
      currentTarget: null,
    } as unknown as ClipboardEvent

    syncTextareaPaste(
      fakePasteEvent,
      () => modelValue.value,
      (val) => { modelValue.value = val },
      val => void predictor.refresh(val),
    )

    await vi.advanceTimersByTimeAsync(0)
    await nextTick()

    expect(modelValue.value).toBe('добрый')
    expect(completeMock).toHaveBeenCalledTimes(1)
    expect(completeMock).toHaveBeenCalledWith('добрый', { lang: 'ru', limit: 5 })
    expect(predictor.predictions.value).toEqual(['вечер', 'день'])

    // Advancing past debounce must not issue a duplicate request
    await vi.advanceTimersByTimeAsync(350)
    expect(completeMock).toHaveBeenCalledTimes(1)
    predictor.dispose()
  })

  it('cancels pending debounce and refreshes immediately when paste follows normal v-model update', async () => {
    const modelValue = ref('')
    completeMock.mockResolvedValue({ text: ['приветствие'], pos: -4 })

    const predictor = usePredictor({
      modelValue: () => modelValue.value,
      onUpdateModelValue: (val) => { modelValue.value = val },
      debounceMs: 300,
    })

    // Simulate browser updating v-model via @input first, then @paste macrotask firing
    modelValue.value = 'прив'
    await nextTick()
    expect(completeMock).not.toHaveBeenCalled()

    const fakePasteEvent = {
      target: { tagName: 'TEXTAREA', value: 'прив' },
      currentTarget: null,
    } as unknown as ClipboardEvent

    syncTextareaPaste(
      fakePasteEvent,
      () => modelValue.value,
      (val) => { modelValue.value = val },
      val => void predictor.refresh(val),
    )

    await vi.advanceTimersByTimeAsync(0)
    expect(completeMock).toHaveBeenCalledTimes(1)
    expect(predictor.predictions.value).toEqual(['приветствие'])

    await vi.advanceTimersByTimeAsync(350)
    expect(completeMock).toHaveBeenCalledTimes(1)
    predictor.dispose()
  })

  it('discards stale in-flight responses and clears old offsets when new text is pasted', async () => {
    let resolveStale!: (val: { text: string[], pos: number }) => void
    completeMock
      .mockImplementationOnce(() => new Promise((resolve) => { resolveStale = resolve }))
      .mockResolvedValueOnce({ text: ['дела'], pos: 1 })

    const modelValue = ref('прив')
    const predictor = usePredictor({
      modelValue: () => modelValue.value,
      onUpdateModelValue: (val) => { modelValue.value = val },
      debounceMs: 300,
    })

    await vi.advanceTimersByTimeAsync(300)
    expect(completeMock).toHaveBeenCalledTimes(1)

    // User pastes new text while the first request is still in flight
    modelValue.value = 'как'
    await nextTick()
    const refreshPromise = predictor.refresh('как')

    // Old request resolves late — must be ignored
    resolveStale({ text: ['привет'], pos: -4 })
    await refreshPromise

    expect(predictor.predictions.value).toEqual(['дела'])
    expect(predictor.insertPosition.value).toBe(1)
    expect(predictor.buildPredictionText('дела')).toBe('как дела')
    predictor.dispose()
  })

  it('loads predictions on mount when input already contains text', async () => {
    completeMock.mockResolvedValue({ text: ['утро'], pos: 1 })
    const modelValue = ref('доброе')

    const predictor = usePredictor({
      modelValue: () => modelValue.value,
      onUpdateModelValue: (val) => { modelValue.value = val },
      debounceMs: 300,
    })

    await vi.advanceTimersByTimeAsync(300)
    expect(completeMock).toHaveBeenCalledWith('доброе', { lang: 'ru', limit: 5 })
    expect(predictor.predictions.value).toEqual(['утро'])
    predictor.dispose()
  })
})
