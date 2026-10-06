# AIOMobile mobile live logs

Implemented and deployed for server testing on 2026-10-03 after explicit authorization. Static build697e7bc3e307457d is published; rollback snapshot is releases/logs-20261003T205653Z/. Accepted release archives and container configuration were preserved. No production logs, credentials or server log-clear operations were used in development.

## User-facing behavior

Bottom navigation is Overview / Streams / Usenet / Logs / More. History & Bandwidth moved into More; its existing hash route still works and Back returns to More.

Logs opens the latest 200 matching records in ascending sequence order, then live-tails with native EventSource. Search debounces for 350ms. The filter sheet supports multiple levels/modules and opt-in case-insensitive regex. Modules come from received records; changing filters replaces incompatible rows and the matching connection. Invalid regex is identified without sending a broken feed request.

Messages use wrapping monospace text and restrained level badges. Expand a row for full message, structured metadata, timestamp/sequence and copy actions. The independent scrolling region follows while at Latest; scrolling upward shows a new-log count. Pause keeps receiving into a bounded pending buffer, and Resume appends it. Reading position is anchored across oldest-row eviction. Visible rows and pending rows each have a 1000-entry cap; older entries are trimmed with a visible notice. SSE state changes reach the app header independently of the stream/provider feeds. Rendering and counters batch every 250ms.

The overflow sheet offers upstream filtered exports and clearing. Clearing requires an explicit second confirmation explaining that **all** server-retained logs, including those outside filters, are removed. Success clears the current and pending windows while preserving the live connection. Failure retains rows and allows retry. Native dialogs trap focus, support Escape and lock controls while pending. Search uses 16px form text and visual-viewport sizing; internal scrolling does not accidentally pull-refresh the whole dashboard.

## API confirmation

Source inspected before implementation: AIOStreams commit `70ffb17a7bb99dd73dbab257af040b04f56eaa42`, dashboard routes, core ring buffer/logger/redaction, and existing frontend log hook. Exact field/query semantics and source paths are recorded in [api-contract.md](api-contract.md#live-logs-local-extension-2026-10-03).

- REST returns `{success,data:{logs,nextSeq,bufferStats}}`; LogRecord/LogQuery declarations are vendored with upstream provenance.
- SSE contains individual raw NDJSON lines with numeric sequence event IDs. Initial `since` uses snapshot `nextSeq`; native reconnection sends Last-Event-ID, and server-retained records backfill. Replay is deduplicated. `since` is sequence-exclusive, while `until` is a timestamp. Comment heartbeats remain invisible to EventSource and do not trigger false disconnects.
- After 30s of unsuccessful reconnection, REST runs no faster than every 30s (or the slower configured interval). Native EventSource keeps its automatic reconnect behavior; CLOSED sources are recreated at most once per minute. A quiet OPEN socket does not poll. Hidden/offline views close traffic and resume with the cursor. 401/403 or an existing login redirect suspends retries and uses the existing sign-in link.
- Both upstream export formats currently write NDJSON, including `.log`; JSON is not an array. The upstream endpoint selects the filtered retained output, rather than the client's displayed window. Client masking runs before downloading, with a 20MB response limit.
- Clear is authenticated POST with JSON `{confirm:true}`. It does not reset sequence numbers or stop SSE; upstream emits an audit warning after clearing. Only the synthetic fixture buffer was cleared in tests.

## Files changed

| Files | Purpose |
| --- | --- |
| `src/api/logTypes.ts` (new) | Vendored LogRecord/LogQuery and verified response shape |
| `src/api/logs.ts` (new) | Filter-preserving upstream exports, authenticated fetch, download limit/masking |
| `src/lib/logs.ts` (new) | Query encoding, validation, parsing, recursive masking and bounded deduplication |
| `src/hooks/useLogs.ts` (new) | Snapshot/incremental SSE, native reconnect/cursors, batching, pause, fallback, clear and lifecycle |
| `src/pages/Logs.tsx` (new) | Mobile list, filters, search, details, copy/export, confirmation, scroll/keyboard behavior |
| `src/components/Sheet.tsx` (new) | Accessible native-dialog sheets |
| `src/App.tsx`, `src/components/Icon.tsx`, `src/styles.css` | Navigation, History relocation, feed indicator, safe-area styling and icons |
| `src/api/client.ts`, `src/lib/diagnostics.ts` | JSON request bodies, existing login-redirect handling, content-free Logs diagnostic source |
| `tests/logs.test.ts`, `tests/e2e/logs.spec.ts` (new) | Contracts, privacy and mobile/browser regressions |
| `tests/fixtures.ts`, `scripts/test-server.ts`, `tests/e2e/polish.spec.ts` | Synthetic log APIs/replay/clear/export and updated navigation coverage |
| `README.md`, `NOTICE`, `docs/api-contract.md`, `docs/validation.md`, `docs/logs-review.md`, `memory.md` | Usage, provenance, validation and maintained project handoff |
| `docs/screenshots/logs*.png` | iPhone viewport captures with synthetic data |

## Screenshots

390×844 CSS pixels, device scale 3 (1170×2532 raster pixels). Test-produced screenshots were inspected visually; these are browser viewport captures, not photographs of a physical iPhone.

- [Logs, live list](screenshots/logs.png)
- [Expanded long technical entry](screenshots/logs-long-entry.png)
- [Filter sheet](screenshots/logs-filters.png)
- [Destructive confirmation sheet](screenshots/logs-clear.png)

## Validation

Final results are recorded in [validation.md](validation.md). Tests use local HTTP fixtures exclusively. A native EventSource fixture deliberately disconnects and replays an ID; both browser engines send Last-Event-ID and retain one row per sequence. Other tests control sources and time to verify auth suspension, bounded fallback, quiet connections, hidden/offline recovery and deferred REST/clear races.

No runtime dependencies, backend, provider/indexer test calls or persistent browser log store were added. Existing production static-only service worker coverage verifies authenticated routes stay out of caches.

## Practical limits

- Upstream retains a bounded in-memory ring, not durable history. Server eviction and client caps limit replay; a very long pause retains only its latest 1000 pending matches. The trimming notice explains this bound.
- Server restarts reset the global sequence. A REST refresh/reopening Logs recovers that reset; a healthy quiet socket is not polled just to discover a restart.
- Module choices are observed names (up to 100 per current viewer session), not a complete server catalogue.
- Exports are capped at 20MB on mobile; narrow filters for a larger retained buffer. The additional masking changes recognizable credential values in the upstream output. Native iOS download/save behavior still needs device confirmation.
- Upstream sensitive logging can bypass its redaction. Recursive client masking protects recognizable credential/header/cookie fields and URL/Bearer/assignment patterns for display/copy/export; it cannot prove arbitrary prose never contains secrets. Keep sensitive server logging disabled and treat exported troubleshooting logs as private.
- Physical iPhone Home Screen mode, software keyboard/pan behavior, real admin session expiry and real server/provider log contents remain operator testing. No production clear was performed, and authenticated/device behavior remains operator testing.
