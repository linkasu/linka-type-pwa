export interface Shortcut {
  keys: string
  descriptionKey: string
  categoryKey: string
}

export const SHORTCUTS_DATA: Shortcut[] = [
  { keys: 'Ctrl / Cmd + ↑ / ↓', descriptionKey: 'shortcuts.switchChat', categoryKey: 'shortcuts.global' },
  { keys: 'I', descriptionKey: 'shortcuts.focusInput', categoryKey: 'shortcuts.global' },
  { keys: 'Ctrl + 0', descriptionKey: 'shortcuts.focusQuickes', categoryKey: 'shortcuts.global' },
  { keys: 'Ctrl + ;', descriptionKey: 'shortcuts.focusBank', categoryKey: 'shortcuts.global' },
  { keys: 'Ctrl + B', descriptionKey: 'shortcuts.toggleSpotlight', categoryKey: 'shortcuts.global' },
  { keys: 'Enter', descriptionKey: 'shortcuts.speak', categoryKey: 'shortcuts.global' },
  { keys: 'Ctrl + Enter', descriptionKey: 'shortcuts.newLine', categoryKey: 'shortcuts.global' },
  { keys: 'Ctrl / Cmd + N', descriptionKey: 'shortcuts.newChat', categoryKey: 'shortcuts.chat' },
  { keys: 'Cmd + L', descriptionKey: 'shortcuts.toggleRecording', categoryKey: 'shortcuts.chat' },
  { keys: 'Enter', descriptionKey: 'shortcuts.sendMessage', categoryKey: 'shortcuts.chat' },
  { keys: 'Alt / Cmd + 1-5', descriptionKey: 'shortcuts.selectSuggestion', categoryKey: 'shortcuts.chat' },
  { keys: 'Ctrl / Cmd + Backspace', descriptionKey: 'shortcuts.clearInput', categoryKey: 'shortcuts.chat' },
  { keys: 'Esc', descriptionKey: 'shortcuts.stopAll', categoryKey: 'shortcuts.chat' },
  { keys: 'Alt / Cmd + 1-5', descriptionKey: 'shortcuts.selectPrediction', categoryKey: 'shortcuts.predictor' },
  { keys: '1-6', descriptionKey: 'shortcuts.speakQuicke', categoryKey: 'shortcuts.quickes' },
  { keys: '1-9, A-Z', descriptionKey: 'shortcuts.selectItem', categoryKey: 'shortcuts.bank' },
  { keys: 'R', descriptionKey: 'shortcuts.randomStatement', categoryKey: 'shortcuts.bank' },
  { keys: 'V', descriptionKey: 'shortcuts.togglePasteMode', categoryKey: 'shortcuts.bank' },
  { keys: 'Esc', descriptionKey: 'shortcuts.back', categoryKey: 'shortcuts.bank' },
  { keys: 'Space', descriptionKey: 'shortcuts.playPause', categoryKey: 'shortcuts.reader' },
  { keys: '← / →', descriptionKey: 'shortcuts.navigate', categoryKey: 'shortcuts.reader' },
]
