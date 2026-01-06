export interface TutorialStep {
  titleKey: string
  contentKey: string
  icon: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  { titleKey: 'tutorial.welcome.title', contentKey: 'tutorial.welcome.content', icon: 'mdi-hand-wave' },
  { titleKey: 'tutorial.typing.title', contentKey: 'tutorial.typing.content', icon: 'mdi-keyboard' },
  { titleKey: 'tutorial.quickes.title', contentKey: 'tutorial.quickes.content', icon: 'mdi-lightning-bolt' },
  { titleKey: 'tutorial.bank.title', contentKey: 'tutorial.bank.content', icon: 'mdi-folder' },
  { titleKey: 'tutorial.shortcuts.title', contentKey: 'tutorial.shortcuts.content', icon: 'mdi-keyboard-outline' },
]

