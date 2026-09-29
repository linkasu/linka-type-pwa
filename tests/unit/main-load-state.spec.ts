import { getMainLoadState } from '~/utils/mainLoadState'

describe('main load state', () => {
  it('shows fatal error only with no usable local content', () => {
    expect(getMainLoadState({
      categoriesFailed: true,
      hasCategories: false,
      hasQuickes: false,
      otherFailed: false,
    })).toBe('error')
  })

  it('keeps cached categories or quick phrase defaults usable with a warning', () => {
    expect(getMainLoadState({
      categoriesFailed: true,
      hasCategories: true,
      hasQuickes: false,
      otherFailed: false,
    })).toBe('warning')
    expect(getMainLoadState({
      categoriesFailed: true,
      hasCategories: false,
      hasQuickes: true,
      otherFailed: false,
    })).toBe('warning')
  })

  it('distinguishes secondary failures from a successful load', () => {
    expect(getMainLoadState({
      categoriesFailed: false,
      hasCategories: false,
      hasQuickes: true,
      otherFailed: true,
    })).toBe('warning')
    expect(getMainLoadState({
      categoriesFailed: false,
      hasCategories: true,
      hasQuickes: true,
      otherFailed: false,
    })).toBeNull()
  })
})
