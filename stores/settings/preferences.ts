import type { UserPreferences } from '~/types/api'

const PREFERENCE_KEYS: Array<keyof UserPreferences> = [
  'darkTheme',
  'yandex',
  'voiceUri',
  'yandexVoice',
  'volume',
  'rate',
  'pitch',
  'showPredictor',
  'showSpotlightPredictor',
  'showQuickes',
  'showBank',
  'typeSound',
  'speakLastWord',
]

export const pickUserPreferences = (
  state: Partial<UserPreferences> | Record<string, unknown>,
): Partial<UserPreferences> => {
  const patch: Partial<UserPreferences> = {}
  const values = state as Record<string, unknown>
  for (const key of PREFERENCE_KEYS) {
    if (values[key] !== undefined) {
      ;(patch as Record<string, unknown>)[key] = values[key]
    }
  }
  return patch
}
