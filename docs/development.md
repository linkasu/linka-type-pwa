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

### Desktop telemetry (optional)
Telemetry is disabled until V3 consent is explicitly granted in the desktop app. The main process uses the production Identity and Metrics endpoints by default. Set `LINKA_METRICS_FORCE=1` only to exercise telemetry in a non-packaged development build.

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
