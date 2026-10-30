# Changelog

## Unreleased

- Added per-indexer Success bars below Import outcomes, with selected-window percentages, successful grab counts, a shared 0–100% scale and explicit no-grab/unavailable states.

- Indexer sorting separates the subject (Grabs, Success rate, Failures) from a labeled ascending/descending arrow button, immediately above the sortable cards.

- Indexers adds an import completion summary, stacked OK/degraded/failed bar, and area-proportional grab-share tiles for the selected time window, with an always-visible share key and consistently sized tile names that take precedence over percentages in small tiles.

- Usenet Live connections uses separate cards with shaded headers for each priority group, labels Primary/Secondary/Backup tiers, and identifies shared load-balanced groups. Missing priority remains explicit.

- Streams opens with current sessions, followed by past-stream history with filename/user search, transport filters and newest/oldest paging. Removed introductory/capacity prose and relocated stream history out of History & Bandwidth.

- Compact live activity overview with aligned active-session, client throughput and Usenet throughput readings; buffered/paused and idle sessions remain included in the active count, and feed freshness covers both sources.

- Overview customization can hide sections and add them back, preserving their saved pins and order; restore defaults shows every section again.
- Compact Live connections panel above Usenet history, with layered in-use/open capacity bars, provider warning summaries and per-connection speed labels.

- Cumulative step graphs for retained Usenet data/articles and global/per-user bandwidth, with touch and keyboard bucket inspection. Missing buckets remain distinct from recorded zeroes; Usenet errors use dated counts.
- Device-local, per-instance health alert dismissal for up to 24 hours, with individual-source controls and rearming for new or increased failures.
- Customizable AIOStreams version/build section with explicit, bounded GitHub release checks and clear unavailable/incomplete results.
- Media Info enrichment coverage, metadata source totals and richer stored video/audio/subtitle details, with compatibility states for older servers.

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
