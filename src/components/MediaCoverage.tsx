import type { MediaSummary } from '../api/monitoringTypes';
import { count } from '../lib/format';
import { Facts } from './UI';

function sourceName(origin: string) {
  return ({local:'Probed here',stremthru:'StremThru',remuxdb:'RemuxDB',remote:'Other instances'} as Record<string,string>)[origin] || origin;
}
export function MediaCoverage({ summary }: {summary:MediaSummary}) {
  const {lookups,stored} = summary;
  return <div className="media-coverage">
    <div className="coverage-heading"><strong>Metadata coverage</strong><span>{lookups && lookups.eligible > 0 ? `${(lookups.filled / lookups.eligible * 100).toFixed(1)}%` : '—'}</span></div>
    <p className="caption">{!lookups ? 'Coverage is unavailable on this server version.' : lookups.eligible === 0 ? 'No eligible stream results recorded.' : `${count(lookups.filled)} of ${count(lookups.eligible)} eligible stream results filled.`}</p>
    {lookups && <p className="caption">Last 24 hourly buckets on this process. Resets on restart; repeated results count again.</p>}
    <details className="secondary-facts"><summary>Sources &amp; stored files</summary><Facts items={stored.byOrigin.map(source=>[
      sourceName(source.origin),<span>{count(source.files)} stored<br/>{count(source.lastDay)} added in last day</span>,
    ])}/>{!stored.byOrigin.length && <p className="caption">No stored files recorded.</p>}
    {lookups && <><h3 className="coverage-source-title">Stream results filled by source</h3><Facts items={Object.entries(lookups.bySource).map(([source,n])=>[sourceName(source),count(n)])}/>{!Object.keys(lookups.bySource).length && <p className="caption">No stream results filled.</p>}</>}
    </details>
  </div>;
}
