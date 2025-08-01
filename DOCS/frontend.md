# Frontend Component Overview

This document explains the purpose of each UI component in the project. Use it to understand how the interface is composed and how components interact with each other.

## High‑level Structure

- **App.vue** – top level component handling authentication state and switching between setup flow (`Setup.vue`) and the main application (`MainUI.vue`).
- **Setup.vue** – onboarding flow that helps a new user configure voice settings and answer a questionnaire for phrase generation.
- **MainUI.vue** – main communicator screen combining header, input area and optional blocks like quick phrases or the phrase bank.

## Blocks

### Auth.vue
Authentication form. Handles email/password login, registration and password reset via Firebase auth.

### Bank.vue
Phrase bank with two hierarchical levels: categories and statements. Allows creating, editing and selecting phrases. Supports keyboard shortcuts and paste mode for inserting statements directly into the input field.

### LHeader.vue
Toolbar displayed on every main screen. Provides buttons for tutorial, brain prediction, keyboard shortcut help, memory cell switcher and settings toggle.

### MainUI.vue
Container for the main communicator interface. Hosts the header, tutorial modal, settings screen, quick phrases, phrase bank and the primary input block.

### Quickes.vue
Block of six "quick phrases" displayed as buttons. Data is loaded from the store and can be activated with 1–6 keys.

### Settings.vue
Tab panel for application settings. Includes voice settings, adaptive interface options and a global category import tool.

### ShortcutList.vue
Overlay listing all available keyboard shortcuts grouped by function.

### Tutorial.vue
Simple overlay with an embedded YouTube video introducing the application.

### Setup.vue
Multistep wizard guiding initial application configuration: greeting, voice check and questionnaire (`PhraseMaker.vue`).

## Components

### AdaptiveSettings.vue
Checkboxes and radio buttons that configure optional interface blocks (predictor, quick phrases, phrase bank) and typing behaviour.

### BadgeButton.vue
Wrapper around a Vuetify button with a numeric badge used inside lists and button rows.

### ButtonRow.vue
Flex layout rendering a row of `BadgeButton` components. Used for quick phrases and the predictor.

### Brain.vue
Interface for the neural text generator. Sends user queries to a cloud function and displays the response with the option to insert it into the input field.

### ImportGlobal.vue
Imports ready-made categories from a global storage. Displays expandable lists with preview of phrases.

### LList.vue
Reusable list component showing either categories or statements. Supports editing, deletion, batch editing of statements and a read‑aloud mode (`Reader.vue`).

### MainInput.vue
Input area with an optional overlay mode. Integrates the predictor (`Predicator.vue`) and plays typing sounds or reads back the last word depending on settings.

### Overlay.vue
Generic dimmed overlay used by several pop‑ups. Clicking outside emits a `quit` event.

### PhraseMaker.vue
Form for answering personal questions. Responses are sent to a backend function to create starter phrases.

### Predicator.vue
Word prediction widget using Yandex predictive API. Offers up to five completions and supports numeric keyboard shortcuts.

### Reader.vue
Fullscreen reader for sequentially speaking statements from a category. Controls playback, navigation and closing with keyboard shortcuts.

### TextCategoryEditor.vue
Textarea based editor for quickly replacing all statements within a category using multiline text.

### VoiceSettings.vue
Controls for choosing a voice, volume, pitch and rate. Supports local `speechSynthesis` voices and optional Yandex voices.

## Assets and Plugins

- `plugins/vuetify.ts` – Vuetify setup with colour theme.
- `plugins/webfontloader.ts` – lazy loads Roboto fonts.

Together these components compose the user interface for LINKa.
