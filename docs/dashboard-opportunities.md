# AIOStreams dashboard opportunities

Reviewed against AIOMobile source on 2026-10-06. The original upstream review used supported commit `70ffb17a7bb99dd73dbab257af040b04f56eaa42` and the then-inspected main `147773cb80d5fd38a1dae7924b6b610abf1d92a9` for Media Info. These are pinned source snapshots, not a claim about the latest upstream revision. Authenticated production responses were not queried.

The core additions and the follow-up recommendations below are implemented and deployed as build `e31e95dfdb520726` on 2026-10-06. Static HTTPS/checksum and service-preservation checks pass; authenticated production behavior remains operator testing. See `docs/api-contract.md`, `docs/validation.md` and `memory.md` for exact semantics and validation.

## Implemented coverage

Paths have prefix `/api/v1/dashboard`.

| Information | Current implementation | Source |
| --- | --- | --- |
| Process CPU/memory, system memory, disk and uptime | Overview System card with expandable details; process readings remain distinct from system readings. No separate System history screen. | `/system`, `/system/stream` |
| Failed/running tasks and schedules | More → Background tasks, with latest results and read-only details. Removed from Overview after operator feedback. | `/tasks` |
| Recent warnings/errors | Five retained warning/error/fatal records on Overview, linking to Logs and using existing masking. | `/logs` |
| Usenet availability/library | Paginated read-only search/status view with files, owner/origin, failure/recheck/blocklist and optional probe-count details. Periodic REST; no library SSE or separate files fetch. | `/usenet/library` |
| Cache reuse/download permits | Usenet cache hit/miss/disk readings, on-wire work, permit usage and waiting capacity. | Existing `LiveStats.cache`/`pool` |
| Retained Usenet trends/provider windows | Recorded transfer/article/error buckets and totals; 24h/7d/30d/all windows preserved into provider details, plus provider records outside the live pool. Live graphs remain separate. | `/usenet/stats` |
| Global stream cap | Overview and Streams show the configured global cap and reported sessions with open reads; zero means unlimited. Replica snapshots can omit reads, so the reported count is not global occupancy. | `LiveStreams.summary` |
| User bandwidth trends/limits | User/group series selection; combined versus unidentified series are distinct. Global gauge uses periodTotal; user gauges appear only for the matching accounting-period window. | `/streams/bandwidth` |
| Richer stream history | Expandable request count, last activity/end and session span, including truthful missing-end handling. Span may include pauses and idle time. | `/streams/history` |
| Addon analytics | More → Addon health: recorded preset requests/error kinds/error rates/average latency, separate custom URL request count, search/sort/pagination, read-only refresh and unavailable-server recovery. | `/analytics/addons` |
| Media Info | Read-only summary, live queue, attempt history and stored tracks, with unsupported-server fallback. | `/media-info`, `/media-info/live`, `/media-info/probes`, `/media-info/files` |

Addon percentages are 0–100, unlike fractional Usenet rates. The supported server uses recent events for 24h/7d but returns all retained daily rollups for both its 30d and all addon paths. AIOMobile exposes **24h, 7d and All rollups** so it does not claim a false 30-day range. Its Indexers view still describes import/grab outcomes, a separate concern from addon search latency/errors.

## Remaining optional opportunities

| Priority | Information | Source | Useful scope |
| --- | --- | --- | --- |
| Medium | Request resource trends and active/total stored configurations | `/analytics/overview`, `/analytics/requests?range=...` | Optional Activity view. Stored configurations are not currently watching people; collection/retention limits coverage. |
| Medium | General cache instance inventory/items/backends | `/cache` | Optional cache inventory screen. Delivered segment/disk-cache metrics do not replace this inventory. No scan/clear actions needed. |
| Low | Running upstream version/channel/build/commit | `/api/v1/status` (outside dashboard prefix) | Settings/About compatibility information. Newer-release comparison would additionally fetch GitHub releases. |
| Low | Dedicated System screen and retained resource history | `/system` historical buffer | Only if diagnosing resource trends needs more than the existing compact card. |

The original highest-priority gaps have been covered. Further work should follow a concrete monitoring need. Community moderation, user administration, instance settings and share/*arr management remain outside the current phone-monitoring scope.

Keep same-origin admin cookies, foreground-only feeds, bounded refresh/sample windows, authentication suspension and static-only PWA caching. No automatic addon/provider tests, indexer grabs, rechecks, cache scans, task runs, probe controls or configuration mutations are introduced.

## Sources

- [Admin dashboard documentation](https://docs.aiostreams.viren070.me/changelog/v2.30/)
- [Rebuilt overview and system history](https://docs.aiostreams.viren070.me/changelog/v2.34/)
- [Usenet guide](https://docs.aiostreams.viren070.me/guides/usenet/)
- [Supported dashboard routes](https://github.com/Viren070/AIOStreams/blob/70ffb17a7bb99dd73dbab257af040b04f56eaa42/packages/server/src/routes/api/dashboard/index.ts)
- [Supported Usenet routes](https://github.com/Viren070/AIOStreams/blob/70ffb17a7bb99dd73dbab257af040b04f56eaa42/packages/server/src/routes/api/dashboard/usenet.ts)
- [Admin analytics contract](https://github.com/Viren070/AIOStreams/blob/70ffb17a7bb99dd73dbab257af040b04f56eaa42/packages/frontend/src/app/dashboard/analytics/queries.ts)
- [Newer Media Info routes](https://github.com/Viren070/AIOStreams/blob/147773cb80d5fd38a1dae7924b6b610abf1d92a9/packages/server/src/routes/api/dashboard/media-info.ts)
