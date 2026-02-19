# LINKa: напиши (Desktop v2)

Desktop-приложение для коммуникации людей с нарушениями речи. Построено на Electron + Vite + Vue 3 и поддерживает локальную офлайн-работу, очередь изменений и синхронизацию при подключении к сети.

## Технологический стек

- Electron
- Vite
- Vue 3 с Composition API
- Vuetify 3
- TypeScript
- Pinia (state management)
- i18n (поддержка языков)

## Требования

- Node.js 18+
- npm/yarn/pnpm

## Настройка

1. Установите зависимости:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

2. Скопируйте .env.example в .env и заполните переменные:

```bash
cp .env.example .env
```

Переменные окружения:
- PREDICTOR_API_KEY - ключ для Яндекс Predictor (опционально, для автодополнения слов)
- API_BASE_URL - URL backend API (по умолчанию https://backend.linka.su)

## Development

Запуск desktop-режима (renderer + electron main/preload):

```bash
npm run dev
```

В dev-сервере:
- `/` — публичная single-page страница загрузки (для `type.linka.su`)
- `/app.html#/...` — основной интерфейс desktop-приложения

## Production

Сборка renderer + electron:

```bash
npm run build
```

Создание инсталляторов:

```bash
npm run dist
npm run dist:mac
npm run dist:linux
```

## Release / CI

- Проверки на `push`/`PR`: `.github/workflows/desktop-ci.yml`
- Релиз desktop (tag `v*`, macOS + Linux): `.github/workflows/electron-release.yml`
- Деплой страницы загрузки в GitHub Pages: `.github/workflows/pages-download.yml`

Подробный релизный регламент, Apple signing secrets и команды DNS (YC CLI):

`docs/release-gh-pages.md`

## Testing

```bash
npm run typecheck
npm run test:unit
npm run test:main
npm run test:e2e:electron
```

Подробные инструкции для Codex-агентов:

`docs/testing-desktop.md`
