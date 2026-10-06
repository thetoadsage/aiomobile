# Everyday monitoring tools

## Needs attention

Overview shows a compact, expandable summary when a provider or indexer has a concrete problem. Each source is listed once and links to its provider detail or a focused indexer view. The focused indexer view keeps window selection available and includes **Show all indexers**.

Provider warnings reuse the existing activity-aware health rules: idle and disabled providers are not automatically unhealthy. Provider rates and indexer failures use the last 24 hours; indexer failures are historical outcomes, not a claim that the indexer is currently offline. A last-error message alone does not flag an indexer. Unavailable checks expose retry/sign-in and stale-snapshot information.

Overview now reads the existing 24-hour Usenet statistics endpoint on the configured historical refresh interval. No provider tests, indexer grabs, mutations, or new backend endpoints were added.

## Find a stream

Search filenames and usernames together, ignoring case and surrounding spaces. Combine search with the existing transport filter. Sort newest first, oldest first, or by highest throughput; the list updates as monitoring data arrives. Clear filters resets the search and transport without changing the chosen sort. Search stays local to the received live snapshot.

## Make Overview yours

Tap **Customize** beside the Overview title. Pin sections to put them first, then move sections up or down within the pinned or unpinned group. All three sections—active streams, Usenet health, and bandwidth—remain visible, and live status and the attention summary remain available above them.

Layout changes save on this device without reconnecting feeds. **Restore default layout** resets only the order and pins. Unknown or incomplete saved layouts are normalized so no section disappears. Failed storage writes leave the current layout intact and show an error.

## Advanced settings

Theme and display preferences stay outside the collapsed **Advanced settings** group. Expand it for the connection address, fallback refresh interval, historical refresh, and chart sample count. Collapsing preserves unsaved edits; **Save preferences** is still required. Invalid connection input reopens the group so the field can be corrected.

## Verification

Regression coverage includes persistence, live refreshes, source links, idle health semantics, storage failures, native and custom validation, keyboard access and 320px layouts in light and dark themes. See the [UI validation summary](mobile-redesign.md#validation).
