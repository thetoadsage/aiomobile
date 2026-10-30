import type { LiveStats, LiveStreams } from '../api/types';
import type { Resource } from '../hooks/useData';
import { visibleTransfers } from '../lib/streams';
import { count, speed } from '../lib/format';

export function LiveActivity({ streams, usenet, showAllTransfers = false }: { showAllTransfers?: boolean; streams: Resource<LiveStreams>; usenet: Resource<LiveStats> }) {
  const feeds = [streams, usenet];
  const live = feeds.every(feed => feed.data && !feed.error && feed.mode === 'live');
  const current = feeds.every(feed => feed.data && !feed.error && (feed.mode === 'live' || feed.mode === 'polling'));
  const status = live ? 'Live' : current ? 'Periodic updates' : feeds.some(feed => feed.error) ? 'Updates unavailable' : feeds.some(feed => feed.data) ? 'Last snapshot' : 'Connecting';
  const delivery = speed(streams.data?.summary.totalBytesPerSec).split(' ');
  const download = speed(usenet.data?.live.currentBytesPerSec).split(' ');
  const readings = [
    { label: 'Active streams', value: count(streams.data ? visibleTransfers(streams.data.streams, showAllTransfers).length : undefined), unit: 'sessions' },
    { label: 'To clients', value: delivery[0], unit: delivery[1] ?? '—' },
    { label: 'From Usenet', value: download[0], unit: download[1] ?? '—' },
  ];
  return <section className="card overview-summary" aria-labelledby="live-activity-heading">
    <div className="summary-heading">
      <h2 id="live-activity-heading">Live activity</h2>
      <span className="summary-freshness"><i className={current ? 'green' : 'orange'} aria-hidden="true"/>{status}</span>
    </div>
    <dl className="summary-grid">
      {readings.map(reading => <div className="summary-reading" key={reading.label}>
        <dt>{reading.label}</dt>
        <dd><strong>{reading.value}</strong><small>{reading.unit}</small></dd>
      </div>)}
    </dl>
  </section>;
}
