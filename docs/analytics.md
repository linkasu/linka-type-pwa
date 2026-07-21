# Telemetry and privacy

## Consent V3

Desktop telemetry is opt-in. Its V3 preference is stored only by Electron main process in `userData/telemetry-consent-v3.json`:

- `unknown`: default; no telemetry runtime, identity request, queue delivery, or renderer event forwarding.
- `enabled`: set by an explicit desktop UI action; collection starts only when `safeStorage` is available and the packaged app (or explicit `LINKA_METRICS_FORCE=1`) can collect.
- `disabled`: collection stops, the durable queue is cleared, and main process requests suppression for an existing installation identity.

Previous `analytics_consent`, `granted`, `denied`, Firebase configuration, and other browser storage are never read as V3 consent. Enabling V3 clears the telemetry directory first, so an earlier queue cannot be delivered after the first opt-in.

## Main-process boundary

The renderer has no Identity credential, metrics endpoint, or network transport. It can invoke only the preload bridge to submit a typed outcome. Electron main process validates the IPC payload, creates an anonymous installation identity, stores its refresh credential with `safeStorage`, writes an atomic file queue, and sends acknowledged V2 batches to Metrics.

The queue is capped, uses per-record files and an active-batch journal, and retains a batch ID as its Idempotency-Key until Metrics acknowledges it.

## Closed outcomes

`electron/telemetry/sanitize.ts` rejects unknown fields and values. The only outgoing stream is Metrics V2 `outcome` for product `linka-type`:

| Outcome | Closed fields |
| --- | --- |
| `phrase_composed` | `source`, `count_bucket` |
| `speech_completed` | `result`, `source`, `mode`, `count_bucket`, `duration_bucket`, optional `failure_code` |
| `bank_action_completed` | `result`, `source`, optional `failure_code` |
| `dialog_action_completed` | `result`, `source`, optional `failure_code` |
| `sync_completed` | `result`, `count_bucket`, optional `failure_code` |

Phrase text, UI text and names, account data, identifiers, recordings, files, URLs, error messages, arbitrary properties, and free-form metadata are rejected. Required app metadata is normalized to closed platform and locale values; version fields are restricted to a safe token format.

## Functional external processing

The privacy notice and settings describe account/sync, online TTS, predictor, and dialog-helper network requests separately. They remain controlled by their feature settings, not telemetry consent.

## Verification

```bash
npm run typecheck
npm run test:unit
npm run test:main
```

Focused tests verify the main-process consent bridge, rejection of legacy grants and free fields, and durable outcome-only batches.
