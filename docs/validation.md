# Validation

## Addon error and response-time charts — 2026-10-30

- Build `e79013df6e4c2415` adds matching horizontal error-rate and average-response-time sections to More → Addon health, with shared chart styling, inline/outside values, responsive labels, accessible meters and independent View data tables. Both use the existing preset aggregates; no endpoint, dependency or server change is required.
- Lint, TypeScript/production build and all 75 unit tests pass. All 12 focused Chromium/WebKit cases pass across addon charts, existing addon monitoring/recovery/responsiveness and Indexers success bars. This is targeted browser coverage, not a new full-suite run.
- Coverage includes a common millisecond scale and proportional bar geometry, exact percentage units, independent data disclosures with error/request counts, recorded zero, missing latency, no requests, selected period, search, card-sort independence, read-only requests, offscreen suspension, unavailable/auth/malformed/empty states and existing Indexers behavior. Synthetic captures at 320px Paper, 390px Sage and 1280px Sage were reviewed; the mechanical detector and whitespace checks report no findings.
- The deployed static build and retained assets were verified by SHA256 over trusted HTTPS, including the mobile root, service-worker and immutable-asset headers. Addon analytics, Streams REST/SSE and history still redirect unauthenticated requests to sign-in. A rollback backup was verified; container and configuration state stayed unchanged, with no restart.
- Addon windows remain 24H, 7D and All rollups. Inspection of the running server confirmed that its 30d and all addon queries both sum all retained daily rows. The charts use the existing server APIs and do not change AIOStreams source or configuration. Collection/retention limits and missing readings remain explicit.
- Automated chart checks use synthetic data. Authenticated production interactions and physical iPhone/PWA behavior were not independently validated for this build. Local project memory, private deployment evidence and review captures stay outside this publication.

## Provider groups and Indexer charts — 2026-10-29

- Build `6cbd62111ef8bc0e`: lint, TypeScript/production build and 66 unit tests pass. All 20 combined provider-connection and indexer-outcome browser cases pass in Chromium/WebKit.
- Coverage includes priority/backup ordering, shared-group labels, missing/removed provider metadata, keyboard detail navigation, small/long labels, empty pools, proportional tile areas, unclipped consistent names, visible small-share keys, selected windows/indexer routes, all six sort combinations, unchanged chart ordering, successful/degraded counts and no-grab/inconsistent snapshots. Treemap unit coverage verifies area conservation and no overlaps for skewed and crowded distributions.
- Synthetic 320px/390px phone and 1280px desktop captures were reviewed in Paper/Sage themes. Monitoring remains read-only, with existing refresh/auth and cache boundaries. These focused checks do not imply a full-suite run.
- Authorized static deployments verified all current build files by SHA256 over trusted HTTPS, retained previous fingerprints and verified rollback backups. Final deployment preserved container/config state and required no restarts. Physical-device feedback drove the tile-label fixes; authenticated payload coverage remains limited to operator testing.


## Overview section visibility — 2026-10-22

- Local build `da717760cbbdb82a`: lint, all 65 unit tests, TypeScript and production build pass. All 34 focused Chromium/WebKit checks pass across monitoring UI and dashboard expansion.
- Customize now offers a Show checkbox for every existing section. Hidden sections retain their pins and saved positions; movement skips hidden sections. Reload preserves visibility, older preferences default to shown, and Restore default layout shows every section again. An all-hidden layout remains recoverable through Customize.
- Browser checks cover keyboard/focus behavior, failed-storage rollback, hide/add-back persistence, default restoration, no live-feed reconnects during layout edits and no API writes. Synthetic captures at 320px Sage, 390px Paper and 1280px Sage were visually reviewed; narrow rows stack consistently, with no horizontal overflow and at least 44px label targets. The mechanical detector reported no findings.
- Documentation matches the new controls. Separately authorized static testing deployment verified all 10 current files and 33 retained fingerprints over trusted HTTPS with matching SHA256, mobile-root content and existing unauthenticated REST/SSE sign-in redirects. Rollback was validated before publication; standalone Compose/Nginx pass, and the four relevant services retain their health, identity, start times, restart counts and configuration hashes. No restarts, commit or push; authenticated production and physical iPhone/PWA behavior remain operator acceptance for this build.

## Compact provider connections — 2026-10-22

- Local build `b64eaf5f7dbce5b7`: lint, 63 unit tests, TypeScript and production build pass.
- 54 focused Chromium/WebKit checks pass across provider connections, lifecycle/navigation and usage/history. After desktop column alignment and deterministic theme capture corrections, all six provider checks pass again. Captures cover 320px Paper, 390px Sage, 768px Midnight and 1280px Sage; theme selection is asserted.
- Checks cover warm-idle versus closed connections, zero maximum, long names, warnings/detail navigation, keyboard activation, stale retained snapshots, empty pools, reduced motion and no API writes. Local visual review confirmed mobile wrapping and aligned desktop bars. Automatic design hooks reported no deterministic issues.
- Final animation correction: connection bars use `transform: scaleX()` instead of width transitions; reduced-motion behavior is preserved. Lint/typecheck/build and all six provider browser checks pass after the change. No hook suppressions or outstanding findings.
- Static testing deployment verified all 10 current files and 31 retained assets over HTTPS with matching SHA256 values. The four relevant services retained their health, identity, start times, restart counts and configuration hashes. Rollback is saved, and existing unauthenticated REST/SSE sign-in redirects remain intact. The operator confirmed the deployed build works.
- Automated browser checks use synthetic fixtures; authenticated production and physical-device behavior were not independently exercised by the agent.

## GitHub publication checks — 2026-10-14

- Current production build: `3f80adc44a201773`. Lint, all 62 unit tests, TypeScript and production build pass.
- The complete Chromium/WebKit suite passes: 159 passed, one intentional duplicate-gallery skip. The gallery now checks actual stream-card visibility instead of a fixed 600px coordinate. Removed an unnecessary immediate reload in the chart fixture that aborted WebKit requests; both chart checks and the complete suite pass afterward.
- README descriptions, build identifier, changelog and synthetic gallery now cover alert dismissal, cumulative usage graphs, server version checks and Media Info coverage. Local README links resolve. Six additional browser checks passed while refreshing the gallery and rechecking charts.
- Project memory and new local review output are ignored; source archives exclude project memory. This publication check did not redeploy the app or verify authenticated production/physical iPhone behavior.

## Cumulative recorded graphs — 2026-10-13

Build `3f80adc44a201773` adds filled cumulative step graphs for Usenet data/articles and global/per-user bandwidth. Inspection distinguishes an absent bucket from a recorded zero; partial buckets and retention limits remain explicit. Errors use dated counts. Existing live throughput charts and API/auth/cache behavior are unchanged.

Lint, 62 unit tests, typecheck and production build pass. All 36 focused Chromium/WebKit app, usage and graph checks pass; all four graph checks passed again after refreshing synthetic screenshot fixtures. Covers sparse/zero/empty/single records, keyboard inspection, metric changes, error counts, no API writes, accounting/aggregate identity and 320/390/1280px Paper/Sage layouts. Screenshot evidence is synthetic. Authenticated production behavior and physical iPhone/PWA acceptance require testing on the deployed instance.

The fresh visual reviewer returned **ship for testing** with no material findings. Authorized static deployment verifies all 10 current files and 29 retained fingerprints with trusted HTTPS 200/SHA256 matches. Standalone Compose/Nginx validate; four relevant containers retain health, identity, starts, restart counts and configuration hashes. REST/SSE still redirect unauthenticated clients to sign-in. Rollback is validated and retained; no container restart, commit or push occurred.

## Needs attention dismissal — 2026-10-13

- Added a 44px X to dismiss the current notification, plus per-source dismissal in the expanded list. Per-instance, device-local preferences expire after 24 hours. New reasons, failure counts above acknowledged levels, newer indexer error timestamps and observed clear/recurrence rearm alerts. Missing/unavailable feeds do not imply resolution; detail pages and server records are unchanged.
- `npm run lint`, `npm test` (59 tests) and `npm run build` pass; build `f3387c20d7b3244c`. All 36 related Chromium/WebKit app/monitoring/dismissal browser checks passed. After correcting repeated screen-reader announcements, all eight dismissal checks passed again, including distinct consecutive announcements, keyboard focus, reload persistence, blocked storage, rearming, no API writes and 320/390/1280px layouts.
- Mechanical detector and the automatic design hook found no deterministic issues. The fresh reviewer marked its sole announcement finding resolved and approved that correction; previous visual review found no material issues. Documentation review is complete. Synthetic phone/desktop captures are in `.impeccable/review/attention-mobile.png` and `attention-desktop.png`.
- Static deployment passes trusted HTTPS 200/SHA256 verification for all 10 current files and 27 retained fingerprints. Rollback is saved; standalone Compose/Nginx validate, and four relevant containers retain health, identities, starts, restart counts and configuration hashes. REST/SSE sign-in redirects remain unchanged. Private evidence is in the ignored release handoff. Authenticated production interaction and physical iPhone/PWA behavior remain operator acceptance; no commit or push.

## Version status and Media Info coverage — 2026-10-13 (deployed)

- Official v2.35/v2.36 docs establish product behavior; version and Media Info fields were inspected at release v2.36.0, commit `ce6244454ee131bf0945b2bd6abc670a449b224d`. No live authenticated instance was queried.
- `npm run lint`, `npm test` (55 tests), and `npm run build` pass. Static-only build: `eb3ff919e6315e5d`.
- Eight focused browser checks pass across Chromium and WebKit: explicit GitHub request, partial release count, build-change reset, unsupported status recovery, rate-limit error, missing/empty/nonzero coverage, source details, richer tracks, no API writes, and 320/390/1280px overflow checks.
- Full browser run: 144 passed, 1 skipped, 3 failed. Two new failures came from the fixture omitting CORS exposure of the Link header; fixed the fixture and all eight new checks passed on rerun. The remaining pre-existing `polish.spec.ts` gallery test still expects the first stream above 600px; it reports 622.875px, matching the earlier known failure. The new version section follows existing sections and does not change that position. The complete suite is not claimed green.
- Browsers were installed in a temporary cache because old browser directories lacked executables. Tests ran outside the sandbox through `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/aiomobile-playwright-20261013 npm run test:e2e`. Existing tracked gallery captures overwritten by the broad suite were restored; the new synthetic review captures remain under `.impeccable/review/`.
- Mechanical design detector returned no findings. Phone/desktop captures show the expanded version details, metadata sources and stored tracks. A fresh finish reviewer returned **ship** with no material findings; the documenter confirmed the extension preserves the incumbent system and existing documentation covers its semantics and limits.
- User separately authorized static deployment. All 10 current files and 25 retained fingerprinted assets returned trusted HTTPS 200 with matching SHA256; `/mobile/` matched the new index. Manifest/index/service worker were published atomically after immutable assets, retaining older assets for open clients. The previous site archive is verified and retained for rollback.
- Standalone Compose/Nginx validate. AIOMobile, AIOStreams, Traefik and Authelia remain healthy with identical IDs/start times/restart counts and configuration hashes. Unauthenticated dashboard REST/SSE retain their 302 sign-in redirects. No container was restarted, no authentication setting changed, and no provider operation occurred. Authenticated production payloads and physical iPhone/PWA behavior remain operator acceptance. No commit or push occurred.

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

## Live activity overview — 2026-10-29

- Replaced the summary with three consistent readings: all current stream sessions (including paused/buffered and idle), throughput to clients, and throughput from Usenet. Removed duplicated session breakdown, per-minute errors and capacity prose from Overview; capacity details remain on Streams. The freshness indicator considers both feeds.
- Build/typecheck, lint and 65 unit tests pass. Focused Chromium/WebKit coverage: 40 checks passed initially; the two capacity checks were updated for the intentional footer removal and passed on rerun. New checks cover active-only counts, unavailable versus zero data, periodic/live status and aligned compact typography.
- Synthetic screenshots inspected at 320px and 390px in sage, 390px in paper and 1280px desktop. Captures remain in ignored `.impeccable/review/live-activity/`. Mechanical design scan has no findings. No deployment or physical-device validation in this change.

## Streams and past sessions — 2026-10-29

- Streams opens with current session cards and a concise Active streams heading. Removed subtitle/capacity prose and moved filtering below current sessions into Stream history. History & Bandwidth no longer fetches or renders session history.
- Past sessions retain filename and exact username filters, All/Usenet/Proxy controls, details and twenty-row paging. Newest/oldest sorting traverses the full matching history through bounded API slices. Live session IDs are excluded defensively from historical cards. Existing missing-end details remain supported.
- Build `6d057da3d18f7765`, typecheck, lint and 65 unit tests pass. Focused Chromium/WebKit checks: 54 initial passes plus two corrected prior-overview assertions passing on rerun; two additional empty-state checks passed. Final responsive checks passed in both browsers after correcting Safari's native select height.
- Inspected active/history screenshots at 320px sage, 390px paper and 1280px sage, under ignored `.impeccable/review/streams-history/`. Mechanical design scan found no issues. No production deployment or physical iPhone validation.

- Deployment follow-up (2026-10-29): build `6d057da3d18f7765` published with verified rollback backup; all 45 installed static files match SHA256 over HTTPS, mobile root matches index and unauthenticated REST/SSE/history requests remain protected. Service identities, health, start times, restart counts and configuration hashes unchanged. Physical-device/authenticated acceptance pending.

## Live activity count correction — 2026-10-29

- The card counts all current sessions, including buffered/paused and idle sessions, matching the Active streams list. Transfer rates remain measured byte throughput and can be zero during buffered playback.
- Build `76ab7650f7558608`: lint, typecheck/build, 65 unit tests and all 10 focused Chromium/WebKit checks passed. Browser checks cover buffered sessions, live throughput updates, empty/error states and responsive layouts.
- Deployed static files with verified backup, retained assets and unchanged container/configuration state. Physical-device acceptance remains user testing.

## Tiny transfer visibility — 2026-10-29

- Build `7c0963ecd1e0488d`: lint, typecheck/build and all 72 unit tests pass. Eighty distinct focused Chromium/WebKit scenarios pass across the initial and corrected runs; the two initial failures were an uppercase test expectation for the existing lowercase paused label, corrected before the affected 14 checks passed again.
- Covers the inclusive 64 KiB boundary, saved/legacy/storage-blocked preferences, active cards/Overview count/history consistency, paused sessions, threshold crossing through SSE and REST, filled history pages across probes, oldest/newest/search navigation, bounded 500-record scanning with continuation, authentication/background/cancellation, and unchanged API write behavior. Existing monitoring, usage, stop-confirmation, settings and service-worker checks remain passing.
- Phone/desktop Sage/Paper captures at 320/390/1280 px were reviewed; the mechanical design scan returned no findings. Synthetic captures stay local and ignored. Physical iPhone interaction and authenticated production acceptance remain user checks.

- Deployment follow-up: all 61 installed static files and the mobile root verified over trusted HTTPS with matching SHA256; live REST/SSE/history authentication redirects remain intact. Verified rollback backup and retained older assets; container/configuration state unchanged, without restart.

## Stream settings under More — 2026-10-29

- Build `e8a88f289abb89ff`: lint, typecheck/build, 72 unit tests and all 30 focused Chromium/WebKit checks pass. Saved visibility still governs active cards, Overview counts and history; the toggle is absent from Streams, accessible under More → Stream settings → Transfer visibility, survives reload and handles blocked storage. Back returns to More and the More tab stays selected.
- Reviewed new section at 320/390/1280px in Sage and Paper; theme attributes explicitly asserted after correcting the screenshot fixture setup, with both responsive browser checks passing again. Mechanical scan clean. Physical iPhone/authenticated production acceptance remains operator testing.

- Deployment verified all 62 installed static files and mobile root by SHA256 over trusted HTTPS; authentication redirects and container/configuration state are preserved. Rollback backup verified before publishing.

## Held furthest file position — 2026-10-29

- Build `8ea13714d58d9316`: lint, typecheck/build and 75 unit tests pass. All 44 focused Chromium/WebKit checks pass, plus the WebKit SSE test with batched detail captures at 320/390/1280px in Sage/Paper. Cards and details reviewed, mechanical scan clean.
- Coverage holds 66% through missing reads/backward seeks, advances on a 70% observation, shares the value across Overview/cards/details and More navigation, preserves a known 0%, and resets after reload/new-session identity. Unit coverage additionally isolates simultaneous sessions and prunes ended IDs. No raw bytes-served ratio is substituted for position; retained percentages stay in memory only. Existing filtering, auth, stop confirmation, settings and static-only worker checks pass.
- Physical iPhone/authenticated production acceptance remains user testing. Buffering, seeking and end probes can put the monotonic file position ahead of playback; the detail caption states that limitation.

- Deployment verified all 63 installed files and root by SHA256 over trusted HTTPS, preserved REST/SSE/history authentication redirects, verified rollback backup and retained old assets; container/config state unchanged without restart.

## Stream card start-age removal — 2026-10-29

- Build `f032ed41cfe812be` removes the relative Started … ago card footer and unused styles. Lint, typecheck/build and all six targeted Chromium/WebKit responsive/held-position checks pass; narrow card capture reviewed and mechanical scan clean.
- Deployment verified all 65 installed static files and root over trusted HTTPS by SHA256, with protected REST/SSE/history routes and unchanged container/configuration state. Rollback backup verified; older assets retained.

## Transfer toggle in existing Settings — 2026-10-29

- Build `9454c36574f9223a`: Show all transfers is in More → Settings → Streams. Removed the separate Stream settings menu/component; older hash links resolve to Settings. Immediate persistence/current-visit fallback preserved, and the settings draft stays synchronized without saving an unfinished instance URL or discarding other edits.
- Lint, typecheck/build, all 75 unit tests and 48 focused Chromium/WebKit checks pass. Includes saved preference navigation/reload, base-URL draft isolation, later form save retaining the toggle, storage failure, existing settings/app flows and 320/390/1280px Sage/Paper captures. Mechanical scan clean; captures reviewed. Authenticated production/physical-device acceptance remains user testing.
- Deployment verified all 66 installed static files and root over trusted HTTPS by SHA256; API authentication redirects and container/config state remain intact, with a verified rollback backup and retained old assets.

## GitHub publication and documentation refresh — 2026-10-30

- Lint, typecheck/production build and all 75 unit tests pass. The production build remains `9454c36574f9223a`; this publication adds documentation and test maintenance alongside the previously deployed stream improvements.
- The full 212-case Chromium/WebKit run passed 206 checks and intentionally skipped one duplicate screenshot capture. Four failures came from older expectations for indexer sort direction and the relocation of history; these tests now exercise the current controls and bandwidth view. A concurrent screenshot run caused one trace-artifact directory failure. A sequential eight-check follow-up passed both corrected tests, the affected palette check and the refreshed README capture in both browsers, covering all 211 non-skipped cases across the runs.
- Refreshed Overview, Streams, Usenet, Indexers and Paper Settings images use synthetic fixtures. Detailed usage and troubleshooting now live in `docs/usage.md`; source installation lives in `deploy/INSTALL.md`. Relative documentation links, anchors and image paths resolve.
- Local `memory.md` remains Git-ignored and absent from the release packager's source/static file lists. This task publishes source and documentation to GitHub; physical-device and authenticated production acceptance remain user testing.
