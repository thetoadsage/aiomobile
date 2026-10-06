# AIOMobile Product

<!-- impeccable:product-schema 1 -->

## Platform

web

AIOMobile is an iPhone-first progressive web app, usable in Safari and installed through Add to Home Screen. It also adapts to larger browser viewports. Its implementation and design language are web-based.

## Users

Self-hosted AIOStreams administrators, including administrators beyond the original operator. They already run an AIOStreams instance and need convenient mobile access to its monitoring and troubleshooting information.

Audience and preservation of the scope below were confirmed by the user on 2026-10-03. Implementation facts come from the existing source and project documentation; they are not new feature commitments.

## Product Purpose

Make an existing AIOStreams instance easy to monitor from an iPhone: see current streaming activity and system health, inspect Usenet providers and library availability, review indexer outcomes and bandwidth/history, and follow server logs and media probes.

Success means an administrator can understand current activity, find relevant details, recognize stale or unavailable data, and deliberately perform the limited supported operational actions.

## Positioning

A small mobile monitoring frontend over AIOStreams' existing admin dashboard endpoints. It reuses the instance's authentication and data rather than introducing a separate backend, credential store, or monitoring service.

## Operating Context

- Prefer serving at `/mobile/` on the existing AIOStreams origin, with the base URL preference left blank. Sign-in delegates to the existing AIOStreams login and requires admin access.
- Live streams, Usenet statistics, and logs use SSE with bounded REST fallback. Historical views use periodic REST refresh. Hidden/offline handling limits background traffic.
- Primary navigation is Overview, Streams, Usenet, Logs, and More. More contains History & Bandwidth, Indexers, Addon health, Background tasks, Usenet Library, Media Info, and Settings; stream and provider details are secondary screens.
- The installed PWA may need its own sign-in if iOS separates its session context. The cached static shell opens offline; live monitoring needs a connection.
- Existing implementation: React, TypeScript, and Vite; React and React DOM are the only runtime dependencies. Hash routing supports static hosting without server-side page routes.

## Capabilities and Constraints

- Monitor live stream activity, throughput, file position, configured global stream cap and reported open reads, provider capacity/activity, retained Usenet trends and provider windows/history, indexer outcomes, per-user bandwidth accounting/trends, and recent stream session details. More → Addon health shows recorded preset requests, errors and latency with separate custom URL request counts; it is read-only and collection/retention limits coverage. Preserve upstream meanings: file position and bytes served are distinct; idle providers and indexers with no grabs are not automatically unhealthy.
- Overview also shows process/system readings and recent retained warnings. These sections use the existing configurable pin/order layout. More → Background tasks shows latest failures, running work and scheduled runs in a read-only screen. Usenet exposes cache reuse and download permits; its Library is read-only, with availability/search/status/file/recheck details. Media Info is read-only and optional on older servers, exposing probe activity, recorded outcomes and stored tracks without starting or cancelling probes.
- View, filter, search, pause, resume, expand, copy, and export retained server logs. The viewer is bounded and keeps received records in memory. Server retention and process restarts limit replay; this is not durable log storage.
- Stopping a stream and clearing retained logs require explicit confirmation. Clearing removes the entire server retained buffer regardless of active viewer filters.
- Do not add automatic provider tests, indexer grabs, instance configuration changes, or other provider/indexer activity. App settings concern connection and display/refresh preferences.
- Preserve existing admin authentication. Do not introduce a separate backend/auth service or store passwords, API keys, or session tokens. Existing session cookies are sent by the browser and are not read by the app.
- Persist only nonsecret preferences. Settings drafts do not connect to a new address until Save. Reject credentials, query strings, and fragments in base URLs, and reject mixed-content connections from an HTTPS app.
- Cache static app assets only. Do not persist or cache authenticated monitoring data, logs, API responses, SSE traffic, login requests, or mutations. Updates require the user's Update action before activation.
- Use actual received data for monitoring and charts. Do not fabricate activity, samples, health scores, or historical coverage. Clearly distinguish live, fallback, offline, empty, error, and authentication states.
- Apply existing additional log masking to display, copy, and downloads. Pattern masking cannot guarantee arbitrary prose contains no secrets; do not promise comprehensive sanitization.
- Same-origin deployment is preferred. A separate instance origin requires credentialed CORS and compatible cookie rules; changing a base URL does not bypass these constraints.
- Supported API shapes and upstream provenance are recorded in `docs/api-contract.md`. Compatibility depends on those endpoints and fields being available in the target instance.
- Preserve the existing AGPL-3.0 license and upstream attribution in `LICENSE` and `NOTICE`.

## Brand Commitments

Existing product name: AIOMobile. Existing product wording includes “Your instance. In your pocket.” and “Built for AIOStreams.” Retain the distinction between this frontend and the AIOStreams instance it monitors.

Existing logo/icon assets are in `public/icons/`; installation metadata is in `public/manifest.json`. No new voice, aesthetic, or identity direction was selected during initialization.

## Evidence on Hand

- `README.md`: existing capabilities, development commands, installation, privacy, and operating guidance.
- `docs/api-contract.md`, `src/api/types.ts`, and `src/api/logTypes.ts`: inspected upstream contracts and type provenance.
- `src/App.tsx`, `src/pages/`, `src/hooks/`, and `src/lib/`: implemented workflows, lifecycle handling, preferences, and masking.
- `tests/`, `scripts/test-server.ts`, and `docs/validation.md`: fixture-based checks and previously recorded validation, not fresh production verification.
- `docs/screenshots/` and `docs/preview-mobile.jpg`: synthetic monitoring/log fixtures showing the existing interface. They are not real instance activity or evidence of physical iPhone behavior.
- `deploy/INSTALL.md`: portable static deployment, update, and rollback instructions.

No customer testimonials, adoption figures, comparative benchmarks, or broad compatibility guarantees are established by these materials. Physical iPhone behavior and authenticated production operation require device/instance evidence for the particular change being evaluated.

## Product Principles

1. Make the administrator's current instance state understandable on a small screen.
2. Preserve the existing instance's authentication, API semantics, and infrastructure boundaries.
3. Keep monitoring truthful: expose freshness, missing data, and limits instead of manufacturing certainty.
4. Make consequential operational actions deliberate and confirmed.
5. Keep the client small, private, and low-maintenance through bounded activity and minimal persistence.

## Accessibility & Inclusion

Preserve existing reduced-motion support (system preference and app preference), keyboard focus handling, skip navigation, labeled controls, status/error announcements, and confirmation-dialog focus behavior. Account for safe areas, the on-screen keyboard, long filenames/log values, and browser text sizing in mobile work.

No additional product-specific accessibility standard or user accommodation was established during initialization.
