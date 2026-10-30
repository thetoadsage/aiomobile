# Using AIOMobile

[← Back to the README](../README.md)

| Screen | What it does |
| --- | --- |
| Overview | Current activity, dismissible health alerts, System health, recent warnings and AIOStreams version/build information; show, hide, pin and reorder sections on this device. |
| Streams | Inspect current streams and file position; browse past sessions with filename/user filters and newest/oldest paging. |
| Usenet | Live throughput, retained activity trends, provider time windows/history, download capacity and segment-cache statistics. |
| Logs | Follow server logs, search/filter, pause the view, copy or export entries. |
| More | History & Bandwidth, Indexers, Addon health, Background tasks, Usenet Library, Media Info and Settings. |

## Library and Media Info

**Usenet Library** shows release availability, failures, files and recheck dates, with search and status filters. **Media Info** shows the current probe queue, recorded attempts and stored video/audio/subtitle tracks. These views are read-only; they do not initiate imports, rechecks or probes. Media Info requires an AIOStreams version with the newer dashboard routes and shows an unavailable message when they are missing.

Media Info also shows the share of eligible stream results filled with metadata, when the server exposes these counters, plus source totals and richer track details. Coverage uses the last 24 hourly buckets on the reporting process, resets on restart and counts repeated results. Missing coverage is shown as unavailable; no eligible results is distinct from 0% coverage.

## Overview and alerts

Overview's **AIOStreams version** section shows the running version, channel, build time and commit when available. Expand **Build & updates** to check GitHub explicitly. Each check fetches one page of up to 100 releases for comparison with the running channel, without cookies, referrer or instance details. An incomplete list reports a lower-bound update count or an inconclusive result. **All releases** opens the upstream archive; this does not update the server or replace AIOMobile's own Update prompt.

Dismiss **Needs attention** alerts with the X, or expand the list to dismiss individual sources. Dismissals stay on this device for up to 24 hours. New or increased failures and observed resolution followed by recurrence bring alerts back; dismissing an alert does not change server records.

**Background tasks** shows the latest results, errors and scheduled runs under More. Opening this screen does not run tasks.

## Streams

**Streams** keeps the highest observed percentage as **Furthest file position** during the current visit, shared across Overview, stream cards and details. It holds between reads and backward seeks, then resets on reload, instance change or session removal. Buffering, seeks and end-of-file probes can put it ahead of playback, even at 100%; it does not measure watched progress. A session with no observed position stays unavailable.

Transfers below **64 KiB** (shown as 64 KB in the app) are hidden from active cards, Overview counts and history by default. Enable **More → Settings → Streams → Show all transfers** to include them. This saved preference changes visibility only; throughput, bandwidth totals and server records are unaffected. Paused sessions stay visible once they cross the threshold. Filtered history checks bounded batches; choose **Next** to continue past a long run of tiny transfers.

## Usenet

**Usenet** separates app-open live throughput from retained history. Its Live connections panel groups providers into separate Primary, Secondary and Backup cards, retaining configured priority numbers and labeling shared-priority groups as load balanced. Each provider row layers connections in use over open connections, with per-connection speed and tap-through provider details. Data and articles use filled, cumulative step graphs; tap the graph or use its slider to inspect a recorded bucket. Flat sections mean no additional activity recorded, and an absent bucket stays distinct from a recorded zero. Errors appear as dated counts. Provider details preserve the selected history window. Retention and resets limit coverage.

## Indexers

**Indexers** shows the selected window’s import completion rate, OK/degraded/failed outcomes, proportional grab-share tiles with a full name/value key, and individual success-rate bars. Success includes degraded imports; indexers with no grabs have no success percentage. Below the charts, choose Grabs, Success rate or Failures and toggle Ascending/Descending to sort the detailed cards.

## Bandwidth and addon health

**History & Bandwidth** adds cumulative global/per-user usage graphs. Past session details are on Streams. Graph totals sum retained buckets and can differ from summary totals at window boundaries. Select **Accounting period** to compare user usage with bandwidth limits; 24h/7d totals cover different windows. The configured monthly reset date determines the monthly period.

**Addon health** shows matching horizontal charts for **Error rate by addon** and **Avg. response times**, followed by detailed addon cards. Error rates use a shared 0–100% scale; response times use a shared millisecond scale. Both charts show the highest values first. Names appear on the left on larger screens and above the bars on phones; short bars place their values outside the fill. Choose **View data** on either chart to see its values and request counts, plus recorded error counts for error rates.

Choose **24H**, **7D** or **All rollups**. All rollups covers all retained daily aggregates, not a fixed month. A separate 30D option is omitted because the supported AIOStreams addon API returns the same unfiltered rollups for 30d and all.

Search filters both charts and the detailed cards. Charts include all matching addons across card pages; the card sort control does not change chart ordering. A recorded zero stays 0.0% or 0 ms, a missing response time stays Unavailable, and an addon with no requests has no chart value. Custom URL request counts remain separate from the per-preset charts. Collection and retention settings limit coverage; an empty window or no recorded errors is not proof of current availability. Opening this screen does not call or test addons.

## Preferences and refresh

In **Settings**, choose Sage, Midnight, Ember, Paper or Glacier, or follow device appearance. Adjust compact spacing, reduced motion and refresh preferences. The header icon follows your selected theme. Keep the base URL blank when using the recommended installation.

Use the top-right refresh button or pull down from the top of a page to refresh. Live data updates automatically while the app is open. The throughput chart needs a few samples before it can draw a line.

Stopping a stream interrupts that playback. Clearing logs removes the **entire server's retained log buffer**, even when filters are active. Both actions ask for confirmation.

## Add to your iPhone Home Screen

1. Open the `/mobile/` URL in Safari.
2. Tap **Share → Add to Home Screen**.
3. Enable **Open as Web App** if shown, then tap **Add**.
4. Launch AIOMobile from the Home Screen. Sign in again if the installed app has a separate session.

The installed icon uses the Flow design in Sage. If an icon update still shows the old image, remove and re-add the Home Screen shortcut.

## Updates and troubleshooting

Back up the deployed files before updating. Keep older fingerprinted JS/CSS assets available, and copy the new `index.html` and `sw.js` last. Static updates do not require restarting AIOStreams. Follow the [update and rollback guide](../deploy/INSTALL.md#updating-an-existing-deployment).

When the app offers **Update**, tap it to load the new version.

- **Cannot connect:** check that AIOStreams is reachable and the app is served on the same hostname. Keep the base URL blank.
- **Login or permission error:** sign in with an AIOStreams **admin** account, including inside the installed app if needed.
- **No data while offline:** expected. Only the app shell is cached; monitoring data and logs are not stored for offline use.
- **Feeds stop in the background:** expected. They reconnect when you return to the app.

The app stores only connection/display preferences. It does not store passwords, API keys or session tokens, and does not automatically run provider tests, indexer grabs or instance configuration changes.
