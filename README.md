# LINKa: напиши (v2)

PWA-приложение для коммуникации людей с нарушениями речи. Позволяет набирать текст и озвучивать его с помощью TTS, использовать быстрые фразы и банк готовых высказываний.

## Технологический стек

- Nuxt 4
- Vue 3 с Composition API
- Vuetify 3
- TypeScript
- Pinia (state management)
- PWA (Vite PWA)
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

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
