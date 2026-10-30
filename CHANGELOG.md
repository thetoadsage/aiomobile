# Changelog

## Unreleased

### Streams

- Hide transfers below 64 KiB (shown as 64 KB in the app) from active cards, Overview counts and history by default. **More → Settings → Streams → Show all transfers** restores them, with a saved preference and a current-visit fallback when storage is unavailable. Throughput, bandwidth totals and server records are unchanged.
- Keep the highest observed **Furthest file position** across Overview, stream cards and details during the current visit. It holds between reads and backward seeks, and resets on reload, instance change or session removal. Buffering and seeking can put it ahead of playback.
- Open Streams with active sessions, followed by searchable, transport-filtered history with newest/oldest paging. Filtered history scans bounded batches and offers continuation through long runs of tiny transfers.
- Remove the relative “Started … ago” line from stream cards; absolute start times remain in details.

### Overview and monitoring

- Add compact live activity readings for visible sessions, client throughput and Usenet throughput, with feed freshness for both sources. Buffered/paused and idle sessions remain eligible for the count.
- Hide and restore Overview sections while preserving their pins and order; restore defaults shows all sections.
- Group Usenet connections into separate Primary, Secondary and Backup cards with configured priorities, shared load-balancing labels, layered connection capacity bars and per-connection speeds.
- Add indexer import completion, stacked OK/degraded/failed outcomes, proportional grab-share tiles with a full name/value key, and individual success-rate bars. Success includes degraded imports; no-grab and unavailable states stay explicit.
- Sort indexer detail cards by Grabs, Success rate or Failures with a separate ascending/descending control.
- Add cumulative Usenet and global/per-user bandwidth graphs with touch and keyboard bucket inspection. Missing buckets remain distinct from recorded zeroes; Usenet errors use dated counts.
- Dismiss health alerts on this device for up to 24 hours; new or increased failures bring them back.
- Show AIOStreams version/build information with an explicit GitHub release check and clear incomplete/unavailable results.
- Add Media Info enrichment coverage, source totals and richer video/audio/subtitle details, with compatibility states for older servers.

### Documentation

- Simplify the README with refreshed mobile screenshots, a short feature overview and direct setup links. Move detailed usage and troubleshooting into a user guide, and consolidate source installation steps in the deployment guide.
- Update the API contract and validation notes for transfer filtering, held file positions and the Settings toggle.

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
