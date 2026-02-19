import type { UserPreferences } from '~/types/api'
import { getUserState, setUserState } from '~/utils/offlineDb'

export const loadCachedUserState = async (userId: string) => {
  try {
    return await getUserState(userId)
  } catch {
    return null
  }
}

export const saveCachedUserState = async (
  userId: string,
  inited: boolean,
  preferences: UserPreferences,
) => {
  await setUserState(userId, {
    inited,
    preferences,
  })
}
