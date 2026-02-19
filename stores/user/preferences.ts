import { DEFAULT_PREFERENCES } from '~/types'
import type { UserPreferences } from '~/types/api'

export const mergeUserPreferences = (
  preferences?: Partial<UserPreferences> | null,
): UserPreferences => ({
  ...DEFAULT_PREFERENCES,
  ...(preferences ?? {}),
})

export const hasUserPreferences = (
  preferences?: Partial<UserPreferences> | null,
): boolean => Boolean(preferences && Object.keys(preferences).length > 0)
