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

## Run dev server
```
npm run dev
```
- Dev server is configured for HTTPS on `https://localhost:3000` when `NODE_ENV=development`.
- Certs are expected in `certs/localhost.crt` and `certs/localhost.key`.

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

## PWA notes
- PWA config is in `nuxt.config.ts` under `pwa`.
- Icons and manifest assets are in `public/icons`.
- Typing sound: `public/sounds/type.wav`.
