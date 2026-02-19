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
  'saveOnSay',
  'typeSound',
  'speakLastWord',
]

export const pickUserPreferences = (
  state: Partial<UserPreferences> & Record<string, unknown>,
): Partial<UserPreferences> => {
  const patch: Partial<UserPreferences> = {}
  for (const key of PREFERENCE_KEYS) {
    if (state[key] !== undefined) {
      ;(patch as Record<string, unknown>)[key] = state[key]
    }
  }
  return patch
}
