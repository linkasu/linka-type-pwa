import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTypeSound } from '~/composables/useTypeSound'

const { settings, speakLastWord } = vi.hoisted(() => ({
  settings: { typeSound: false, speakLastWord: true },
  speakLastWord: vi.fn(),
}))

vi.mock('~/stores/settings', () => ({ useSettingsStore: () => settings }))
vi.mock('~/composables/useTTS', () => ({ useTTS: () => ({ speakLastWord }) }))

describe('word speech', () => {
  beforeEach(() => {
    settings.speakLastWord = true
    speakLastWord.mockClear()
  })

  it('speaks only the completed last word', () => {
    useTypeSound().handleTextInput('Привет мир ', 'Привет мир')
    expect(speakLastWord).toHaveBeenCalledExactlyOnceWith('мир')
  })

  it('does not speak when disabled', () => {
    settings.speakLastWord = false
    useTypeSound().handleTextInput('Привет ', 'Привет')
    expect(speakLastWord).not.toHaveBeenCalled()
  })

  it.each([
    ['unfinished word', 'Привет', 'Приве'],
    ['repeated space', 'Привет  ', 'Привет '],
    ['empty word', ' ', ''],
    ['unchanged text', 'Привет ', 'Привет '],
    ['deletion exposing a space', 'Привет ', 'Привет мир'],
    ['cleared input', '', 'Привет '],
  ])('does not speak on %s', (_name, value, oldValue) => {
    useTypeSound().handleTextInput(value, oldValue)
    expect(speakLastWord).not.toHaveBeenCalled()
  })
})
