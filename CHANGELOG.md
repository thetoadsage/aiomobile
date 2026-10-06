# Changelog

## 0.1.0 — 2026-10-03

First tested release of AIOMobile, a standalone mobile-first AIOStreams monitoring PWA.

- Overview, active streams and stream details, including live throughput charts.
- Usenet metrics, provider connections/details, and indexer outcomes.
- Bandwidth windows, per-user usage, stream history filters and pagination.
- Confirmed single-stream stop action, with cancellation and error handling.
- Same-origin session cookies, credentialed SSE, bounded REST fallback and background suspension.
- Dark cards, bottom navigation, safe-area layout, pull-to-refresh and reduced-motion preferences.
- Installable manifest, app icons, static-only offline cache and explicit update activation.
- Portable static deployment/source archives, pinned Nginx image and SHA-256 checksums.

Validation: TypeScript, lint, production build, seven unit tests and fourteen Chromium/WebKit tests pass. The operator reported that live testing passed. Authenticated live data and physical iPhone behavior were not independently verified by the agent.
