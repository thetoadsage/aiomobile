# Mobile polish and hardening review

2026-10-03. Focused local pass after the operator reported successful testing with real streams. No live stop requests, provider/indexer actions, deployment, or publication performed in this pass.

## Screen audit and changes

| Screen | Issues found | Change |
| --- | --- | --- |
| Overview | Four tall metrics and a historical graph preceded playback; repeated marketing text | One compact instance summary, active streams next, then provider readiness and historical bandwidth. SSE/REST health and errors remain visible. First stream begins above 500 CSS pixels in the 390px regression. |
| Streams | Overlong supporting copy, tiny speed/transfer text, absolute dates consuming attention | Shorter cards, larger speed, served / size, rounded position percentage, relative start time. Two-line release names; tapping opens the full filename. State color and progress transitions; surviving rows slide into place after membership changes. |
| Stream Details | Connection metadata and explanation took space from monitoring; confirmation lacked filename and keyboard handling | Primary facts retained, connection metadata expandable. Stop confirmation includes filename, focus trap, Escape cancellation, scroll lock, disabled pending actions, and retryable failures. |
| Usenet | Tall tiles, raw pool state concealed idle/circuit-breaker meaning | Shorter metrics and provider cards; Online / Idle / Disabled / Offline / Connecting / Tripped labels. Explicit missing/error/capacity/auth/throttle warnings. Quiet activity text instead of an error. |
| Provider Details | Sixteen equally prominent fact rows | Essential throughput, capacity, articles, bytes, rates, and latency first; secondary statistics expandable. Health warning conditions match Usenet. |
| Indexers | Eleven fact rows per indexer made failures hard to compare; no sorting | Compact grabs / failures / degraded / missing summary. Auth and rate-limit warnings, latest error visible. Sort by most grabs, lowest success rate, or most failures; secondary stats expandable. No health score. |
| History / Bandwidth | Refresh cleared cards/charts; repeated supporting copy; long chart timestamps | Existing data retained during background/manual refresh, shorter time labels, no redundant intro sentence. Existing filters, windows, limits and pagination retained. |
| Settings | No safe troubleshooting view | Optional local diagnostics with Clear; no additional connection fields or secret storage. Existing preference drafts still make no requests until saved. Form text is now 16px for iPhone focus. |

## Reliability and performance

- Live feeds now belong to a small `LivePages` component below the shell. Only connection-mode changes notify App. Settings, History, Indexers, navigation, and update controls do not rerender on each SSE frame. Memoized page resources prevent unrelated Usenet frames from rendering stream details and vice versa.
- Manual refresh uses the current resource lifecycle: snapshots, chart buffers and existing EventSource instances survive. A subtle overlay indicates REST refresh; initial requests use skeletons.
- Failed or invalid SSE frames retain the last snapshot and enter bounded REST polling. A delayed REST result or non-authentication failure cannot override a newer SSE frame, including frames received in the same millisecond. A connection stuck in CONNECTING for over 30 seconds falls back. An OPEN change-only stream stays live: upstream heartbeat comments are invisible to EventSource onmessage. SSE retries remain once per minute, default REST fallback every 15 seconds.
- Timers, fetches and sources clean up on unmount or reconfiguration. Hidden/offline states suspend traffic; visibility/connectivity restoration resumes. 401/403 failures suspend automatic retries and offer the existing AIOStreams login.
- Connection indicator: Live / Reconnecting / REST fallback / Offline. Fallback and error snapshots show elapsed age and explicitly warn that they may be stale.
- Chart samples remain bounded in memory. Charts use stable power-of-two ceilings, short time/date labels, explicit zero-data messages, readable units and no horizontal scrolling.
- Provider warning thresholds are transparent UI heuristics, not invented upstream fields or scores: ≥10% missing or ≥5% errors, only with at least 20 articles + missing + errors in the selected 24h statistics. No available connections warns only with queued fetches. Idle and disabled providers do not receive capacity warnings.
- Diagnostics retain at most 80 structured events in memory. Only enumerated event/source names, local timestamps and numeric HTTP status codes enter the log. No response bodies, error messages, filenames, hosts, headers, credentials or full URLs enter it. No telemetry or new storage.
- Service worker updates prompt explicitly before activation/reload. Another tab's controller change cannot silently reload this tab. Checks occur on foreground return and hourly. API, SSE, login and mutations remain outside the static cache.
- Interaction feedback uses pressed states, larger controls and a bottom confirmation sheet. Reduced motion applies to CSS and list motion. Back returns to the page that opened a detail screen; scroll resets after route DOM updates, and browser history continues to handle normal navigation. The bottom navigation is opaque to keep underlying text from bleeding through.

## Changed files

- Shell/live lifecycle: `src/App.tsx`, `src/hooks/useData.ts`, `src/api/client.ts`.
- Shared UI: `src/components/UI.tsx`, `StreamCard.tsx`, `StreamList.tsx` (new), `Chart.tsx`, `Diagnostics.tsx` (new), `src/styles.css`.
- All eight audited pages: `src/pages/Overview.tsx`, `Streams.tsx`, `StreamDetails.tsx`, `Usenet.tsx`, `ProviderDetails.tsx`, `Indexers.tsx`, `History.tsx`, `Settings.tsx`.
- Helpers: `src/lib/health.ts` and `diagnostics.ts` (new).
- Regression coverage: `tests/api.test.ts`, `tests/health.test.ts` (new), `tests/e2e/app.spec.ts`, `tests/e2e/polish.spec.ts` (new).
- Handoff: `README.md`, `memory.md`, `docs/validation.md`, this report and `docs/screenshots/`.

## Validation

TypeScript, lint and production build pass; 10 unit tests and 39 browser tests pass. One duplicate WebKit screenshot capture is intentionally skipped. Final results are recorded in [validation.md](validation.md). Tests use local synthetic API/SSE fixtures and controlled failure injection. Existing fixture SSE tests still exercise actual EventSource traffic. New lifecycle tests control EventSource to deterministically test disconnect, invalid frames, quiet change-only feeds, state changes and reconnection without contacting the real instance.

## Remaining rough edges

- Actual iPhone Home Screen operation, safe areas with the keyboard, hardware interaction feedback and extended real-instance recovery still need operator testing on the new build. Browser engines and screenshots are not device proof.
- Feedback is visual; no hardware haptic promise or dependency on native APIs. Native edge-swipe behavior is left to Safari/iOS rather than intercepted.
- Provider graphs show live samples collected in this session, not invented per-provider history. Provider warning percentages use the existing 24h stats and are described as such.
- Streams removed by the server disappear immediately; surviving rows animate into position. Ended streams are not retained as stale playback cards.
- A service worker controller-change regression uses a controlled registration; the existing production-worker test separately verifies static cache and offline shell behavior. A two-version deployment should still be exercised on the installed iPhone before release.
- Existing v0.1.0 release archives and the tested server build are preserved. This local polish build has not been deployed or repackaged under the old version.

## iPhone screenshots

Synthetic fixtures; 390 × 844 CSS pixels, device scale 3. Full-page versions preserve the same width and show scroll content. These contain no real stream filenames, addresses or provider credentials.

| Screen | Viewport | Full page |
| --- | --- | --- |
| Overview | [Screenshot](screenshots/overview.png) | [Full page](screenshots/overview-full.png) |
| Streams | [Screenshot](screenshots/streams.png) | [Full page](screenshots/streams-full.png) |
| Stream Details | [Screenshot](screenshots/stream-details.png) | [Full page](screenshots/stream-details-full.png) |
| Usenet | [Screenshot](screenshots/usenet.png) | [Full page](screenshots/usenet-full.png) |
| Provider Details | [Screenshot](screenshots/provider-details.png) | [Full page](screenshots/provider-details-full.png) |
| Indexers | [Screenshot](screenshots/indexers.png) | [Full page](screenshots/indexers-full.png) |
| History / Bandwidth | [Screenshot](screenshots/history.png) | [Full page](screenshots/history-full.png) |
| Settings | [Screenshot](screenshots/settings.png) | [Full page](screenshots/settings-full.png) |


## Deployment follow-up

The user subsequently authorized server deployment for testing on 2026-10-03. The polished build is now deployed with prior assets/rollback preserved; no containers or authentication configuration changed. Deployment checks pass; authenticated iPhone testing remains with the operator. See [deployment notes](../deploy/README.md).


## Operator-reported corrections (2026-10-03)

- Confirmed in installed server source: stream SSE snapshots are deduplicated and heartbeat comments sent every 15s. The previous no-message watchdog wrongly closed healthy idle feeds every 30s. It now times out only a stalled CONNECTING state. Actual errors still trigger bounded REST fallback; initial REST seeding shows Connecting rather than falsely reporting fallback.
- Provider badges now describe Active (acquired connections or queued work), Idle, or Disabled. Persistent pool connection state, breaker flags and non-decaying throughput estimates do not imply an idle provider needs attention. Warning conditions apply only while work exists. Idle speed is labeled Last sampled speed. No upstream types/fields changed.
- The app shell now fills the dynamic viewport on short pages, keeping bottom navigation anchored on Streams and More. Tested all five tabs at three heights in both engines; physical iPhone behavior remains the operator's confirmation.
