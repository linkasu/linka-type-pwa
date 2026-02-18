# Desktop Testing (Codex Agents)

## Preconditions

- Node.js 20+
- `npm install` completed
- For UI e2e: Playwright browser installed (`npx playwright install chromium`)

## Quick verification

```bash
npm run typecheck
npm run test:unit
npm run test:main
npm run test:e2e:electron
```

## Full local verification

```bash
npm run test:all
```

## Electron manual run

```bash
npm run dev
```

This starts:
- Vite renderer (`http://127.0.0.1:5173`)
- TypeScript watch build for `electron/main.ts`
- preload bridge copy (`electron/preload.cjs -> dist/electron/preload.cjs`)
- Electron desktop shell

## Electron e2e smoke

```bash
npm run test:e2e:electron
```

What this smoke covers:
- renderer boot in Electron shell
- first-run mode selection (offline)
- navigation `login -> main -> settings -> main -> chat`
- core input interactions on `main` and `chat`

Notes:
- test launches Electron against `http://127.0.0.1:4174`
- `playwright.electron.config.ts` auto-builds `dist/electron/main.js` and starts `vite` automatically

## Voices (unauthorized) smoke

Expected behavior:
- `GET /v1/voices` returns public voice list even without bearer token
- desktop bridge can request voices from renderer via `window.desktop.backend.request`

Quick backend check:

```bash
curl -sS -o /tmp/voices.json -w '%{http_code}\n' https://backend.linka.su/v1/voices
```

Expected code: `200`

## Sync e2e (planned)

```bash
npm run test:e2e:sync
```

`test:e2e:sync` remains a scaffold until dedicated `/v2` mock fixtures are added.

## CI recommendation

Use two mandatory jobs:
- `verify`: `npm run typecheck && npm run test:unit && npm run test:main`
- `desktop-e2e`: `npm run test:e2e:electron` with artifact export (`trace`, `video`, screenshots)

## Troubleshooting

- If Electron fails to launch in dev, ensure `dist/electron/main.js` exists (watch build started).
- If renderer imports fail, run `npm run typecheck` to locate unresolved aliases.
- If network calls fail in desktop, verify `API_BASE_URL` points to reachable backend (the client uses `/v1` endpoints).
