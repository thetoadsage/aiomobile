# Validation — 2026-10-06

## Retained usage and addon monitoring deployed — 2026-10-06

User authorized deployment of validated build `e31e95dfdb520726` at the operator's same-origin `/mobile/` URL. Includes retained Usenet charts/provider windows/history, configured stream cap and scoped reported reads, richer session details, user bandwidth trends/period gauges and More → Addon health. Rebuilt static output reproduces the tested build exactly. Reopen the app and select **Update** when prompted.

All10 current files and23 retained fingerprints return trusted HTTPS200 with matching SHA256 (33unique files). Standalone AIOMobile/AIOStreams/Traefik/Authelia remain healthy with identical IDs/start times/restarts/configuration; Compose/Nginx validate. No restart or authentication change. Addon analytics/Usenet statistics REST and Streams SSE preserve unauthenticated302 login redirects. Local/server originalv0.1.0 and new archive checksums pass. No commit/push or release-package overwrite.

Snapshot: `releases/usage-20261006T174216Z/`, with prior site/config/memory rollback, prior README, current static/uncommitted-source archives, build/checksum manifests and before/after/final-state/HTTPS evidence. Local evidence: `/private/tmp/aiomobile-usage-deployment/`.

Rollback:

```sh
cd /opt/docker/apps/aiomobile
tar -xzf releases/usage-20261006T174216Z/previous.tar.gz site
```

No restart needed. Authenticated production values and physical iPhone/PWA behavior remain operator testing; no provider/indexer/addon operations were performed.

## Local retained usage and addon monitoring — 2026-10-06

Implemented historical Usenet transfer/article/error charts and totals, provider window selection/historical-provider rows, global stream-cap visibility, richer stream-history details, per-user bandwidth trends/period-matched gauges, and More → Addon health. These views retain existing authentication, foreground lifecycle, static-only caching and confirmed mutations. No new dependencies.

Fresh typecheck, lint and production build pass; 49 unit tests pass. Before the review corrections, the complete fixture browser suite passed 137 functional checks in Chromium/WebKit with one existing duplicate screenshot capture skipped. After correcting cap accounting, provider membership on live-feed failure and disclosure visibility, all 18 focused Chromium/WebKit checks pass, including idle/recently-streaming sessions with no reads, paused sessions with reads and a live503 response alongside valid retained stats. New cases cover provider window/Back context, removed-provider records, finite shape validation, single/empty historical buckets, unlimited stream caps, bandwidth aggregate identity and accounting-period gating, over-limit gauges, missing history ends, addon percentage units, search/sort/pagination/read-only requests, hidden/offscreen suspension, unavailable/auth/malformed/empty states and 320/390/1280px layouts.

Tests use an isolated fixture port through `AIOMOBILE_TEST_PORT=4184` and `CI=1` to prevent reuse of an older local fixture server on 4174. Existing explicit-origin service-worker/log tests now follow the configured fixture origin. An initial build caught and corrected a test-fixture inference error; an initial browser layout check used the older server and correctly found its missing addon fixture route. The clean isolated runs pass. No runtime fixes were needed for those harness issues.

Final build `e31e95dfdb520726`: JS337.74KB /103.40KB gzip, CSS39.97KB /8.89KB gzip. Fifteen synthetic CUA captures in `.impeccable/review/usage-expansion/` cover Usenet, History, Addon health, Overview and Streams at320Paper/390Sage/1280Sage. Final captures were taken at document scrollY=0; fixed bottom navigation remains at the original viewport boundary in full-page images. All tested views fit without horizontal overflow; select controls meet44px targets. The changed-target mechanical detector reports no findings. Regression-generated tracked gallery files were restored; dedicated review captures are retained.

The independent finish review returned `ship` on its bounded verdict pass: both material monitoring fixes and the user disclosure affordance were scored resolved. The initial full review found the visual extension consistent with the existing system.

Source/fixture evidence only. No authenticated production responses, physical iPhone/PWA tests, provider/indexer/addon activity, deployment, commit/push or release packaging. Earlier sections below describe previous builds and deployments.

## Background tasks testing deployment — 2026-10-06

User explicitly authorized deployment of validated build `c2ba86879984c43b`. All10 current files and22 retained fingerprints return trusted HTTPS200 with matching SHA256 (31unique files; currentCSS also retained). Final four-container health/identity/start/restart/configuration and Compose/Nginx hashes match the fresh preflight baseline. Nginx/Compose validate, new archives and original v0.1.0 checksums pass. No restart, authentication change, task/provider/indexer operation or Git publication.

Tasks/Media Info REST and System SSE retain302 redirects to existing login without a session. Authenticated task data and physical installed-iPhone behavior remain operator testing. Snapshot/rollback: `releases/background-tasks-20261006T161244Z/`; instructions in `deploy/README.md`. Reopen and select Update. Earlier sections record their state at that time.

## Local Background tasks navigation change — 2026-10-06

Background work moved from Overview to More → Background tasks (`#background-tasks`). Task requests now belong to that mounted screen; Overview customization removes the old task section while retaining other saved pins/order. Existing read-only details and masking remain intact.

Build/typecheck/lint and40unit tests pass. All30 targeted Chromium/WebKit checks pass across dashboard expansion and monitoring UI suites. Coverage includes deep link, More active/Back navigation, no task requests on Overview, task GET-only behavior, refresh/hidden pause/resume/cleanup, legacy pinned-task preference migration, existing Overview customization and other expanded monitoring screens. Nine synthetic WebKit captures at320/390/1280Paper/Sage show no horizontal overflow in Overview, More and Background tasks. Build `c2ba86879984c43b`: JS324.05KB /99.66KB gzip, unchanged CSS38.54KB /8.63KB gzip. No dependencies or CSS changed.

Fresh finish review disposition `ship` for the prescribed relocation, with no material fixes. Local only; the previously deployed build remains `ebec4f169f5ea3bd`. No commit/push/deployment or authenticated/device testing in this change.

## Dashboard testing deployment — 2026-10-06

User explicitly authorized deployment of the validated local build `ebec4f169f5ea3bd`. All10 current files and20 retained fingerprints return trusted HTTPS200 and match SHA256 (30unique files). Before/after four-container identity, health, start/restart counts and configuration hashes are identical; Compose/Nginx files unchanged and validate. New archives and original v0.1.0 archive checksums pass. No restart, authentication change, provider/indexer activity or Git publication.

Unauthenticated System/Media Info REST and System SSE retain302 redirects to existing login. Read-only container inspection already confirmed Media Info routes; authenticated endpoint responses and physical installed-iPhone operation remain operator testing. Snapshot/rollback under `releases/dashboard-20261006T155550Z/`; exact instructions in `deploy/README.md`. Reopen and select Update before testing. Earlier local-validation/deployment statements below describe their state at that time.

## Local dashboard expansion — 2026-10-06

TypeScript, lint, production build and 40 unit tests pass. Browser coverage passes all 119 functional checks in Chromium and WebKit, with one existing duplicate screenshot capture intentionally skipped. The full run passed 115 checks; four checks passed after correcting the test harness to reload saved themes and account for the Overview-only System feed. No application fixes were required by those failures.

New checks cover System/task/warning rendering and masking, preservation of saved Overview pins/order, cache and download capacity, read-only Library search/status/pagination/file/recheck information, Media Info probes/outcomes/stored tracks, unsupported-route retry suspension/recovery, auth/malformed/empty states, manual refresh and hidden/offline lifecycle. Existing stream-position, Logs, provider, navigation, Stop, authentication and static-only offline/PWA checks remain covered. No runtime dependencies added.

Twelve synthetic WebKit captures in `.impeccable/review/` cover Overview, Usenet, Library and Media Info at 320px, 390px and 1280px, including Paper and Sage themes and expanded detail states. They were visually inspected; fresh finish review found no material issues. No horizontal overflow, and new selects meet the 44px touch target after a Safari-specific sizing correction. The documenter confirmed the incumbent design system remains in use. Original tracked screenshot galleries were restored after automated capture; the dedicated new review captures are separate.

Build `ebec4f169f5ea3bd`: JavaScript 323.54KB / 99.57KB gzip; CSS 38.54KB. This is local implementation only; no deployment, commit, push, release packaging or server mutation. Read-only inspection of the running nightly AIOStreams container confirmed Media Info routes and shipped declarations, not authenticated endpoint responses. Production payloads and installed-iPhone behavior require operator testing.

The screenshot command's first automatic approval review rejected a task-summary click because it interpreted the task label as a destructive action. The click was omitted and captures completed; no task was run. Older sections below describe earlier builds.

## Current UI refresh — 2026-10-03

Post-task hook correction removed the pre-existing progress width transition. Build/typecheck/lint and four focused Chromium/WebKit screen-field/layout tests pass on the final build below. No suppression or outstanding hook finding; the full 79-test result was obtained before this final CSS-only correction.

TypeScript, lint, production build, and 17 unit tests pass. The final full browser suite passes 79 tests in Chromium/WebKit, with one duplicate screenshot capture intentionally skipped. Six additional confirmation cases pass after tightening the new layout checks to wait for each exact route and verify scroll reset. All ten screens fit 320×690, 390×844, 844×390, 768×1024, and 1280×900 without horizontal overflow or clipped metric values; bottom navigation remains anchored and landscape Logs retains over 100px of scrollable reading space. Settings touch/keyboard operation and persistence, compact grouped rows, focus visibility, and targeted 4.5:1 text/control contrast checks pass.

Major mobile and desktop screens, log filters, full-page content, and landscape captures were visually reviewed in one initial pass and one confirmation pass. Build `e7944089ea9af2ad`: JS 289.90KB / 90.18KB gzip, CSS 25.66KB / 6.10KB gzip. No runtime dependencies added. The reviewed screenshots and README preview use synthetic fixtures. Details and reproduction instructions are in [ui-refresh.md](ui-refresh.md).

Explicitly authorized deployment completed at the operator's same-origin `/mobile/` URL. All ten files return HTTPS 200 and match the validated local build; all eight previous fingerprinted assets remain unchanged and previous Logs JS/CSS also match over HTTPS. Four relevant containers remain healthy with identical IDs/start times/restart counts, configuration hashes unchanged, Nginx validation passes, and original v0.1.0 archive checksums pass. Unauthenticated Streams/Usenet SSE and Logs REST/SSE return 401. Rollback/source/evidence are retained under `releases/ui-refresh-20261004T011121Z/`. Physical iPhone and authenticated production checks remain operator testing. Earlier sections below describe earlier builds.

## Original build

- `npm run typecheck`: passed.
- `npm run lint`: passed with no warnings.
- `npm test`: 7 API/formatting/privacy tests passed.
- `npm run build`: passed. Main JavaScript: 260.80 KB, 80.94 KB gzip; CSS: 13.36 KB, 3.87 KB gzip. Entire dist approximately 320 KB.
- `npm audit`: zero reported vulnerabilities.
- `npm run test:e2e`: 14 tests passed, seven each in Chromium and WebKit.

Browser tests cover navigation/details/provider/indexer fields, actual SSE updates, 320/390/768/1280px overflow checks, history query filters/pagination, 401 retry suspension and existing sign-in links, bounded REST fallback, credential URL rejection/no draft network activity, stop confirmation/cancellation/success, static cache contents, and app-shell reload without persisting authenticated data.

Chromium tests network offline mode. WebKit tests refused connections to the fixture origin because Playwright offline emulation currently rejects service-worker navigation even when a worker returns a literal response: https://github.com/microsoft/playwright/issues/42775. The WebKit cache/fallback assertions passed with the origin unreachable.

The in-app browser was also reviewed at 390×844. Update activation was exercised; screenshots use synthetic fixtures and are labeled accordingly. No real AIOStreams provider/indexer/stream requests were made. No production deployment or physical iPhone Home Screen installation has been performed. The vendored contract targets the inspected upstream commit; actual instance version/authentication must be checked during deployment.

Local validation used Node 26.10.0 and npm 11.19.1. The browser binaries were installed under `/private/tmp/aiomobile-playwright` to avoid modifying the user's normal browser profile. In this sandbox the test command used `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/aiomobile-playwright`; normal setups can use the standard Playwright cache.

## Release acceptance

The operator reported that live testing passed on 2026-10-03 and requested the next release step. v0.1.0 artifacts were prepared; the agent did not independently verify authenticated data or physical iPhone behavior.

The extracted source archive successfully installed its lockfile in a clean directory and rebuilt all ten app files byte-for-byte. Archive content checks exclude local hostnames, operator paths, environment secrets, node_modules and AppleDouble entries. Portable Compose rendering on the server matches the existing network, hostname, and authentication middleware with no published ports.


## Focused mobile polish pass

- `npm run typecheck`: passed (also included in production build).
- `npm run lint`: passed with no warnings.
- `npm test`: 10 tests passed across API/privacy/format and provider-health cases.
- `npm run build`: passed. JavaScript 271.14 KB / 83.93 KB gzip; CSS 17.88 KB / 4.79 KB gzip. No runtime dependencies added.
- `npm run test:e2e`: 39 passed, 1 intentionally skipped, in 50.9 seconds. All functional cases run in Chromium and WebKit. Only WebKit's duplicate screenshot generation is skipped.
- Eight 390×844 CSS-pixel viewport screenshots and eight full-page screenshots saved in docs/screenshots; PNG dimensions verified (1170px raster width at device scale 3).

The full original suite passed, plus regression coverage for Streaming/Paused/Idle transitions and stream removal; retained manual-refresh snapshots; aged disconnected data; REST fallback and SSE recovery; silent OPEN sockets; delayed REST failures after a newer SSE frame; authentication expiry during a live session; two-feed retention during navigation; hidden/offline suspension; malformed live frames; provider state/rate/capacity rendering; calm empty states; indexer sorting and explicit auth/rate-limit failures; safe local diagnostics; stop pending/failure/cancellation; opt-in PWA updates; origin-aware detail Back; post-render scroll reset; and readable iPhone input sizing. Overflow checks cover 320/390/768/1280px.

The new update test uses a controlled registration to verify notification/activation behavior; the existing production service worker test separately verifies static caching and offline shell. Screenshots use synthetic fixtures. No authenticated production data, live stream stop or provider activity was tested by the agent in this pass. Actual installed-iPhone recovery and a two-build PWA update remain operator checks. This local build has not been deployed or published; accepted v0.1.0 server assets and release archives are preserved.


## Polish server deployment

Explicitly authorized and completed 2026-10-03. All ten current static files match the validated build over trusted HTTPS; old JavaScript/CSS remain available. Nginx validates, configuration hashes match, and AIOMobile/AIOStreams/Traefik/Authelia container IDs/start times/restart counts are unchanged and healthy. Original v0.1.0 archive checksums and new test-snapshot archive checksums pass. Rollback and source archives are retained. Unauthenticated dashboard REST/SSE return 302 to the existing /login. Authenticated data and installed-iPhone update behavior remain operator tests. See deploy/README.md and memory.md for exact paths.


## Corrective testing deployment — 2026-10-03

Reported connection oscillation was traced to deduplicated stream snapshots and invisible SSE heartbeat comments in the installed AIOStreams route. Healthy OPEN feeds now remain live; stalled CONNECTING and actual error paths still fall back. Idle providers never inherit attention warnings from persistent connection state, circuit flags or throughput averages. Activity badges and Overview use Active/Idle/Disabled. The dynamic viewport minimum height stabilizes short-tab navigation.

TypeScript, lint, production build and 10 unit tests pass. Final full browser suite: 45 passed, 1 duplicate screenshot capture intentionally skipped (54.0s), in Chromium/WebKit. A real change-only EventSource fixture and controlled socket tests stay live for three simulated minutes without REST/reconnect traffic. Cold idle providers with breaker/error-rate/throughput remnants show Idle with no attention warning. Navigation stays at viewport bottom on five tabs at heights724/844/900. Physical iPhone confirmation remains with the operator.

Build944982dc86a41419 is deployed. All10 live static files match over HTTPS. Original container IDs/start times/restarts and configuration hashes unchanged; all healthy. Rollback/test archives under releases/corrections-20261003-1 on the server. No provider/indexer/live-stop activity or authenticated production payload testing.

## Local mobile log viewer — 2026-10-03

- `npm run typecheck`: passed.
- `npm run lint`: passed, no warnings.
- `npm test`: 17 tests passed across three files, including verified log shapes, sequence/event-ID parsing, bounded deduplication, every supported query parameter, export filter preservation, recursive masking, confirmed JSON POST and login redirects.
- `npm run build`: passed. JS 290.43KB / 90.30KB gzip, CSS 23.80KB / 6.10KB gzip; build 697e7bc3e307457d. Runtime dependencies remain React/ReactDOM only.
- Final complete `npm run test:e2e`: 73 passed, 1 intentionally skipped (the existing duplicate WebKit major-screen screenshot run), about 90 seconds, in Chromium and WebKit. All 28 log-viewer cases pass; original stream/provider/history/auth/PWA cases also pass.
- Final screenshot-only check: both Chromium/WebKit mobile/landscape cases passed after explicitly setting 390×844 before capture (the iPhone13 device preset otherwise starts with a shorter usable Safari viewport). Four log screenshots are 1170×2532 raster pixels at scale 3; inspected visually. No screenshots use production payloads.

New browser coverage includes initial snapshot and SSE cursor; actual native Last-Event-ID reconnect with deliberate replay; duplicate suppression; row expansion and sanitized copy; combined level/module selection; debounced substring and advanced regex/invalid regex; pause/resume and buffered new-log indicators; upward scroll and return to Latest; visible/pending caps and anchored reading position during eviction; navigation cleanup and History relocation; clear cancellation/JSON/success/retained live feed/retryable failure; upstream filtered export in both formats with sanitized downloaded bytes; auth 401/403 retry suspension; quiet OPEN feeds/no polling; failed-reconnection fallback and recovery; delayed REST success after new SSE/clear; hidden/offline lifecycle; simulated visual keyboard viewport; long-value wrapping and landscape safe navigation.

Tests use local synthetic HTTP fixtures and controlled time/sources; native replay is separately tested with real EventSource. Server log retention is process-local, sequence reset after process restart requires refresh/reopen on a quiet feed, long pauses trim oldest pending entries, export responses are capped at 20MB, and pattern masking cannot guarantee arbitrary prose contains no sensitive content. Physical iPhone installation/keyboard/downloads and real authenticated server payloads remain operator testing.

No production log-clear, provider/indexer calls, deployment, container/configuration updates, Git publication or release-archive overwrite was performed. See docs/logs-review.md for changed files and screenshots; memory.md maintains the local handoff.

## Logs server testing deployment — 2026-10-03

Explicitly authorized after local review. Deployed build 697e7bc3e307457d with rollback/source/static snapshots under `releases/logs-20261003T205653Z/`. All 10 current files return HTTPS 200 and match local SHA256; previous corrective assets remain available. The four relevant containers stayed healthy with identical IDs/start times/restart counts, and Compose/Nginx hashes match. Nginx validation and original v0.1.0 archive checksums pass. Existing Logs REST/SSE authentication returns 302 to /login without a session. No authenticated production log contents, clear action or provider activity was tested by the agent. Physical iPhone testing remains with the operator.
