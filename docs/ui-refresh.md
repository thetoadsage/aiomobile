# Mobile UI refresh — 2026-10-03

Scope: refine the existing dark navy web PWA for self-hosted AIOStreams administrators. Preserve routes, monitoring fields, data semantics, authentication, settings persistence, live-feed lifecycle, log operations, and the confirmations for stream stop and clearing retained logs. Implementation and fixture verification were local; the user subsequently authorized the deployment recorded below. Accepted v0.1.0 release archives remain preserved.

## Visual system

`src/styles.css` now owns one consolidated system instead of successive override layers:

- Native system font stack, with no font download. Screen titles 32px (36px at wider widths), section titles 18px, row titles 15–16px, body/labels 14–15px, and secondary data 12–13px. Inputs remain 16px to avoid iPhone focus zoom. Numerical data uses tabular digits.
- Background `#0c121c`, card `#171f2c`, raised controls `#222e40`, inset controls `#101824`, line `#2b3749`, primary text `#eef2f8`, secondary text `#a6b4c9`. Blue `#82b2ff`, green `#79dfb9`, amber `#f0c080`, red `#ffa4ad`; tinted backgrounds preserve semantic state meaning.
- Spacing scale 4/8/12/16/20/24/32px, 16px card radius, 10px control radius. Cards use borders without decorative shadows. Headers and bottom navigation stay opaque and respect safe areas.
- Grouped More/settings rows, consistent segmented filters and form controls, and switch styling on existing settings checkboxes. Controls keep at least 44px touch targets; their semantics and settings behavior are unchanged.
- Clear screen titles replace redundant decorative uppercase kickers. Provider details retain their meaningful “Last 24 hours” context. Existing factual explanations, statistics, warnings, filenames, and operational labels remain.
- Shared styling for detail facts, charts, loading/error/empty states, log rows, filters and confirmation sheets. Keyboard focus, text selection, caret, and scrollbars use the same palette.
- No page/card entrance effects, icon glows, or press scaling. Existing purposeful stream reordering remains with reduced-motion support; progress bars update directly from data without animating width. Compact mode preserves the log scroller and flush grouped menu geometry.

`src/App.tsx` supplies route classes for wider detail/settings layouts. Page markup changes remove decorative labels; `src/pages/Logs.tsx` also gives Apply filters the shared primary-button treatment. `src/components/Icon.tsx` uses the existing SVG system for a quieter ellipsis More icon. `index.html` and `public/manifest.json` align the browser/PWA theme color with the refreshed background; installation icons, scope, and launch behavior are preserved.

## Verification

Post-task hook review: the flagged width transition was carried forward from the existing progress-bar styling. Removed it to avoid layout-property animation; no ignore or suppression was added and no finding was left standing. Rebuilt successfully; TypeScript/lint and four focused Chromium/WebKit screen-field/layout cases passed after this CSS-only correction. The 79-test full-suite results below precede this final transition removal.

- TypeScript, lint, production build, and 17 unit tests passed.
- Final full Chromium/WebKit suite: 79 passed, one intentionally skipped duplicate screenshot capture, about 1.4 minutes. All existing functionality checks pass.
- After strengthening the layout test to wait for each exact route/heading and verify scroll reset, its six Chromium/WebKit cases passed again. All ten routes were checked at all five viewport sizes in both engines.
- Text/status palette, input-placeholder, and primary-button contrast checks passed the 4.5:1 threshold. This is targeted contrast verification, not a claim of a complete accessibility certification.
- Reviewed the mobile screen matrix, representative full-page content, desktop matrix, log filter sheet, and landscape Logs. One correction batch put the landscape log heading and search on the same row and reduced navigation height while preserving touch targets, giving the scroller more than 100px at 844×390. Final captures confirmed the correction.
- Final build: `e7944089ea9af2ad`; JS `index-JeSzM67D.js` 289.90KB / 90.18KB gzip; CSS `index-D7Vxrrll.css` 25.66KB / 6.10KB gzip. No dependencies added.
- Updated `docs/screenshots/` and the README preview with synthetic fixtures. Additional desktop/landscape captures and contact sheets are in `docs/screenshots/ui-refresh/`.

The initial browser launch failures were missing matching Playwright binaries followed by the macOS sandbox blocking Chromium process registration; they were not app assertions. Matching browsers are stored in `/private/tmp/aiomobile-playwright-browsers`, and the fixture-only browser suite runs outside the sandbox. Reproduce with `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/aiomobile-playwright-browsers npm run test:e2e` while this temporary cache exists, or install matching Chromium/WebKit engines into the normal Playwright cache on another machine.

New `tests/e2e/ui-refresh.spec.ts` checks all ten routes at 320×690, 390×844, 844×390, 768×1024, and 1280×900 in Chromium and WebKit: horizontal overflow, clipped numeric values, bottom-navigation anchoring/touch targets, usable log scrolling, native-looking settings controls with keyboard focus and persistent saves, compact mode, filtered logs, and text/placeholder/button contrast.

The existing suites continue to exercise live updates, stale/error/empty states, navigation, history filtering/pagination, stream stop, log search/pause/replay/export/clear, authentication, PWA updates, and static-only offline caching against local synthetic fixtures.

Physical iPhone installation, Safari toolbar/keyboard behavior, and authenticated production operation require operator device checks. The deployment verified static files, service health, and unauthenticated rejection without exercising authenticated production actions.

## Deployment — 2026-10-03

Published build `e7944089ea9af2ad` to the operator's same-origin `/mobile/` URL after explicit authorization. All ten current files checksum-match over HTTPS; older assets remain available. Four relevant containers stayed healthy with unchanged IDs/start times/restarts and configuration hashes. No restart was needed. Original v0.1.0 archives pass their existing checksums.

Rollback/source/evidence: `releases/ui-refresh-20261004T011121Z/`, mirrored locally without the server's potentially sensitive previous-site archive. Restore only `site` from `previous.tar.gz` to roll back; reopen clients and accept Update. See [the deployment guide](../deploy/INSTALL.md#rollback) for general rollback instructions. Source was archived before deployment notes; updated handoff records are saved separately.
