# Backend v2 Contract for Electron Client

Desktop client now expects backend endpoints under `/v2` and uses device authentication headers:

- `X-Client-Type: electron`
- `X-Device-Id: <device_id>`
- `X-Api-Key: <api_key>`

## Required endpoints

- `POST /v2/devices/register`
- `POST /v2/devices/refresh`
- `GET /v2/categories`
- `POST /v2/categories`
- `PATCH /v2/categories/{id}`
- `DELETE /v2/categories/{id}`
- `GET /v2/categories/{id}/statements`
- `POST /v2/statements`
- `PATCH /v2/statements/{id}`
- `DELETE /v2/statements/{id}`
- `GET /v2/quickes`
- `PUT /v2/quickes`
- `GET /v2/user/state`
- `PUT /v2/user/state`
- `GET /v2/global/categories`
- `GET /v2/global/categories/{id}/statements`
- `POST /v2/global/import`
- `GET /v2/factory/questions`
- `POST /v2/onboarding/phrases`
- `GET /v2/predictor`
- `GET /v2/voices`
- `POST /v2/tts`

## Compatibility check

Use:

```bash
./scripts/check-backend-v2.sh
```

This validates basic `/v2` availability and device registration behavior.
