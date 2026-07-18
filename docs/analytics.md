# Analytics and privacy

## Consent FSM

Analytics consent has three persisted states under `analytics_consent`:

- `Unknown`: the default. Firebase modules are not loaded, no Firebase app exists, and Electron blocks analytics endpoints.
- `Enabled`: set only by an explicit user action. Production builds may dynamically load Firebase Analytics and open its network policy.
- `Disabled`: collection is stopped, the Firebase app is deleted, and Electron blocks analytics endpoints again.

Legacy explicit values `granted` and `denied` migrate to `Enabled` and `Disabled`. Dismissing the first-run notice stores only `analytics_notice_dismissed`; it leaves consent at `Unknown`. Account, AAC, authentication, offline mode, synchronization, and the offline change queue do not depend on analytics consent.

Development, automated, and test runs do not initialize collection even if their persisted consent is `Enabled`. `VITE_DISABLE_ANALYTICS=true` also disables collection in a production build.

## Initialization boundary

`composables/analytics/service.ts` contains the consent FSM, `composables/analytics/consent.ts` owns persistence, and `plugins/firebase.client.ts` is the lazy Firebase adapter. The adapter uses dynamic imports for both `firebase/app` and `firebase/analytics`. The imports, `initializeApp`, `initializeAnalytics`, Firebase installation traffic, Google Tag Manager, and Google Analytics traffic cannot occur before `Enabled`. Automatic `page_view` is disabled so route/location data cannot bypass the event allowlist.

Electron adds an independent default-deny guard in `electron/privacyNetwork.ts`. The guard applies only to analytics hosts. It deliberately does not block the LINKa backend, Firebase Authentication, Firebase Storage, online TTS, predictor, or dialog services.

## Event allowlist

`types/analytics.ts` is the typed and runtime-enforced allowlist. Callers can use only the specific trackers returned by `useAnalytics()`; the generic event sender is not exposed.

Allowed events never include entered content, account addresses, authentication or device identifiers, section/item identifiers or names, recordings, file locations, or exception messages. Settings are not sent as events or user properties. No analytics user ID or user properties are set.

The current events contain only coarse action metadata:

| Event | Parameters |
| --- | --- |
| `predicator_use` | numeric position |
| `spotlight` | open/close |
| `say` | coarse length bucket, playback/download |
| `quickes_say` | numeric position |
| `bank_cselect` | none |
| `bank_sselect` | paste mode boolean |
| `login`, `logout`, `register` | none |
| update/mobile prompt events | none or broad platform |
| `bank_cache_started`, `bank_cache_completed` | item count |

## Functional external processing

The privacy notice and Privacy settings disclose these operations separately from telemetry:

- Account and synchronized data are processed by the LINKa backend and Firebase Authentication/Storage for sign-in, storage, and synchronization.
- Content selected for an online voice is sent to the TTS service for synthesis.
- Input is sent to the predictor service while that feature is enabled and used.
- Microphone recordings, sound, and utterances are sent to recognition and dialog-helper services when dialog features are used.

These requests are controlled by their corresponding product features, not analytics consent.

## Verification

Run:

```bash
npm run test:unit
npm run test:main
npm run test:e2e:electron
```

The unit suite verifies FSM persistence, delayed SDK loading, transitions, test collection disablement, legacy migration, and parameter sanitization. Main-process tests verify the network allow/block boundary. Electron E2E verifies that `Unknown` loads no Firebase analytics module, sends no analytics requests, remains dismissible, and does not block offline AAC or later settings changes.
