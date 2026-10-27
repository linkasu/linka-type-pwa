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
- VITE_TTS_INSTALLATION_TOKENS_ENABLED - включает анонимный TTS через installation token; по умолчанию `false`

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
npm run dist:win
npm run dist:linux
```

`dist:mac` собирает два варианта: `arm64` (Apple Silicon) и `x64` (Intel).

## Release / CI

- Проверки на `push`/`PR`: `.github/workflows/desktop-ci.yml`
- Релиз desktop (tag `v*`, macOS + Windows + Linux): `.github/workflows/electron-release.yml`
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

## Лицензия

Собственный программный код LINKa в этом репозитории распространяется на условиях
GNU General Public License версии 3 или, по выбору получателя, любой более поздней
версии (SPDX: `GPL-3.0-or-later`). Полный неизменённый текст GPLv3: [LICENSE](LICENSE).

Разрешены использование, форки, изменения и коммерческое использование. При
распространении покрываемого GPL кода и производных программ необходимо соблюдать
GPL: сохранять уведомления об авторстве, лицензии и отсутствии гарантий, отмечать
изменения и их даты, предоставлять соответствующий исходный код получателям и
лицензировать покрываемую производную программу на условиях GPL. Личные изменения,
которые не распространяются, публиковать не требуется. Гарантии не предоставляются
в пределах разделов 15–16 GPLv3.

Авторы и правообладатели сохраняют права на свои вклады; существующие имена и годы
авторства сохраняются в исходниках, уведомлениях и истории Git. Поддержка или участие
АНО «Линка» сами по себе не означают передачу ей исключительных прав. Copyright FSF
в тексте GPL относится к тексту лицензии, а не к авторству программы. Ранее
предоставленные права на версии под MIT/BSD/ISC не отзываются.

Эта GPL-декларация относится только к собственному программному коду и не
перелицензирует сторонний код, SDK/DLL Tobii, Unity-компоненты, зависимости,
изображения, звуки, шрифты, бренды и учебные материалы. Их исходные лицензии,
атрибуция и ограничения сохраняются; права на товарные знаки не предоставляются.
Публичная доступность файла не заменяет разрешение правообладателя. Совместимость
всей готовой сборки с GPL и права на материалы без подтверждённой лицензии этим
изменением не устанавливаются.
