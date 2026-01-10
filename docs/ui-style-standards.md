# UI Style Standards

This document captures visual decisions that should stay consistent across UI updates.

## Spotlight mode

- Full-screen stage with layered radial gradients and a dark base to keep focus on text.
- Primary input uses a large `clamp()` font size, rounded corners, and a high-contrast border.
- Footer layout is compact: predictor on the left, hints on the right. When the predictor is off, hints are centered.

## Spotlight predictor (desktop only)

- Use `Predictor` with `variant="spotlight"`, `compact`, and `showTitle=false`.
- Keep a small footprint: max width 720px and minimal vertical height.
- High-contrast buttons: brighter background, visible borders, and subtle shadow for separation.
- Colors must remain aligned to the current theme (no hardcoded light surfaces).

## Behavior and toggles

- Spotlight predictor is gated by `settingsStore.showSpotlightPredictor` and only rendered at `lgAndUp`.
- Main predictor is hidden while Spotlight is open to avoid duplicate requests.
- Alt/Meta + 1–5 shortcuts must work even inside Spotlight input.
