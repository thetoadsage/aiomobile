# AIOMobile project memory

## Project and working rules

- Static React/TypeScript/Vite PWA for an existing AIOStreams instance, served at `/mobile/` on the same HTTPS origin. Existing admin cookie and API/SSE contracts; no separate backend or credential storage.
- Read `README.md`, `docs/api-contract.md`, `docs/validation.md` and `deploy/INSTALL.md` for product, API, verification and deployment details. API source pins are recorded in the contract document.
- Maintain this file with concise, public-safe project context. Keep real hostnames, personal paths, production payloads, credentials and operational evidence outside tracked files. Environment files, dependencies, build/test output and `releases/` are ignored.
- For browser checks, use `npm run test:e2e`; request execution outside the sandbox if macOS browser registration requires it. Do not repeatedly retry restricted-sandbox browser crashes.
- Deployment and physical iPhone/PWA acceptance require their own evidence. Preserve existing service routing, authentication, configuration and rollback assets during authorized deployments.

## Current product — 2026-10-06

- Overview: customizable activity, stream capacity, Usenet health, accounting-period usage, System health and recent warnings.
- Streams: local search/filter/sort, active read file position including range offset, read count/cap semantics, and confirmed single-stream stop. File position is not playback time.
- Usenet: live samples, retained transfer/article/error history, provider windows/history, download capacity and segment-cache metrics. Sparse buckets and removed-provider semantics remain explicit.
- More: History & Bandwidth with per-user trends/period-matched gauges, Indexers, Addon health, Background tasks, Usenet Library, Media Info and Settings. Monitoring screens are read-only; opening them never triggers tasks/probes/provider/indexer/addon tests.
- Logs: live search/filter/pause/copy/export and confirmed whole-buffer clear. Pattern masking does not guarantee arbitrary prose contains no personal information.
- Five themes plus device appearance; Flow branding, reduced motion, compact spacing, static-only PWA cache and explicit client Update prompt.
- Upstream version/update status remains a possible future feature, distinct from the existing client Update prompt.

## Publication baseline — 2026-10-06

- Public source starts from the reviewed current snapshot with fresh history. Real deployment hostnames, private operational notes and original history are excluded.
- README descriptions match current monitoring features; Overview, Streams, Usenet and History gallery images were refreshed from isolated synthetic fixtures. Current build/typecheck and the focused WebKit gallery check pass.
- Privacy review covered source/configuration/documentation, commit identities, screenshot text and image metadata. Fixture credentials and demo identities are intentional test data. Preserve public-safe context in future changes.
- LICENSE, NOTICE, public GitHub attribution and configured Ko-fi funding metadata are retained.
