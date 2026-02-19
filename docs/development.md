# Development

## Requirements
- Node.js 18+
- npm, pnpm, yarn, or bun

## Install
```
npm install
```

## Environment
- `API_BASE_URL` (default `https://backend.linka.su`)
- `PREDICTOR_API_KEY` (optional, used by backend)

### Firebase Analytics (optional)
По умолчанию используется проект `distypepro-android`. Для переопределения:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

См. `docs/analytics.md` для деталей.

## Run dev server
```
npm run dev
```
- Dev renderer is available on `http://127.0.0.1:5173`.
- `npm run dev` also starts Electron main process and opens desktop app.

## Docker dev
```
./dev.sh
```
- Generates local SSL certs if missing.
- Runs `docker-compose.dev.yml`.

## Build
```
npm run build
npm run preview
```

## Lint helpers
- `npm run lint:size` runs `scripts/check-file-size.ts`.

## Entrypoints
- `index.html` — public download landing page (for `type.linka.su`).
- `app.html` — renderer entrypoint for the desktop app.
- Typing sound asset: `public/sounds/type.wav`.
