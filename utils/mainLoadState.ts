export type MainLoadState = 'error' | 'warning' | null

export const getMainLoadState = ({
  categoriesFailed,
  hasCategories,
  hasQuickes,
  otherFailed,
}: {
  categoriesFailed: boolean
  hasCategories: boolean
  hasQuickes: boolean
  otherFailed: boolean
}): MainLoadState => {
  if (categoriesFailed && !hasCategories && !hasQuickes) return 'error'
  return categoriesFailed || otherFailed ? 'warning' : null
}
