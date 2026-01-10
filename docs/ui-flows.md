# UI and Flows

## Pages
- `/` (`pages/index.vue`)
  - Decides to route to `/main` or `/login` after auth initialization.
- `/login` and `/register`
  - Email/password auth. On success, checks `userStore.needsSetup`.
- `/setup`
  - 3-step onboarding (welcome, voice settings, finish).
- `/main`
  - Primary typing and speech UI.
- `/settings`
  - Tabs: Voice, Adaptive, Import, Account.

## Layouts
- `layouts/app.vue`
  - Main app shell with header, drawer, shortcuts, tutorial, offline indicator.
- `layouts/auth.vue`
  - Card layout for login/register.
- `layouts/default.vue`
  - Minimal layout used by setup.

## Main screen composition
- `MainInput` (`components/main/Input.vue`)
  - Textarea with Enter to speak, Ctrl/Cmd + Enter for newline.
  - Spotlight toggle button.
  - Speak, stop, download (Yandex only), clear.
- `Predictor` (`components/Predictor.vue`)
  - Debounced suggestions from `/api/predictor`.
- `Quickes` (`components/Quickes.vue`)
  - 6 quick phrases with keyboard shortcuts 1-6.
- `Bank` (`components/Bank.vue`)
  - Categories and statements list with keyboard mapping.
  - Paste mode toggles insert vs speak.
  - Reader mode and bulk text editor.
- `SpotlightDialog` (`components/main/SpotlightDialog.vue`)
  - Full-screen, high-contrast input.

## Bank details
- `BankHeader` toggles paste mode, reader, text editor, random statement.
- `BankList` renders items with QWERTY key shortcuts.
- `BankItemDialog` adds or edits categories/statements.
- `Reader` is a full-screen TTS player for statements.
- `TextEditor` bulk edits statements as newline-separated text.

## Settings tabs
- Voice settings: TTS provider, voice choice, volume/rate/pitch, test.
- Adaptive settings: show predictor/quickes/bank, save-on-say, type sound, speak last word, dark theme, locale.
- Import: view and import global categories.
- Account: logout and delete account.

## Keyboard shortcuts
Source of truth: `types/shortcuts.ts`.
- Global: Ctrl/Cmd + Up/Down (switch chat), I (focus input), Ctrl+0 (quickes), Ctrl+; (bank), Ctrl/Cmd+B (spotlight)
- Predictor: Alt/Cmd + 1-5
- Quickes: 1-6
- Bank: 1-9, A-Z, R (random), V (paste mode), Esc (back)
- Reader: Space (play/pause), Left/Right (navigate), Esc (close)

## Accessibility
- ARIA labels are used on most controls.
- `MainSpotlightDialog` and `Reader` are optimized for visibility.
- `OfflineIndicator` announces connectivity changes.
