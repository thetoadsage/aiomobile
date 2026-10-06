import { useState } from 'react';
import type { UsenetStatsOverview, UsenetWindow } from '../api/types';
import type { Resource } from '../hooks/useData';
import { bytes, count, date, speed } from '../lib/format';
import { usenetWindowLabel } from '../lib/usage';
import { Chart } from './Chart';
import { Facts, Section, Status } from './UI';
import { UsenetWindowPicker } from './UsenetWindowPicker';
export function UsenetHistory({ stats, window, change, loginUrl }: { stats: Resource<UsenetStatsOverview>; window: UsenetWindow; change: (window: UsenetWindow) => void; loginUrl: string }) {
  const [metric,setMetric] = useState<'bytes' | 'articles' | 'errors'>('bytes');
  const data = stats.data;
  const labels = {bytes:'Data fetched',articles:'Articles fetched',errors:'Fetch errors'};
  return <Section title="Recorded activity" action={<span className="muted">{usenetWindowLabel(window)}</span>}>
    <UsenetWindowPicker window={window} change={change}/>
    <Status resource={stats} loginUrl={loginUrl}/>
    {data && <div className="card chart-card usenet-history">
      <Facts items={[["Data fetched",bytes(data.totals.bytes)],["Articles fetched",count(data.totals.articles)],["Fetch errors",count(data.totals.errors)]]}/>
      <div className="segmented" aria-label="Recorded activity metric">{(['bytes','articles','errors'] as const).map(value => <button key={value} aria-pressed={value === metric} onClick={() => setMetric(value)}>{value === 'bytes' ? 'Data' : value === 'articles' ? 'Articles' : 'Errors'}</button>)}</div>
      <Chart points={data.throughput.map(point => ({at:point.bucketMs,value:point[metric]}))} label={labels[metric]} unit={metric === 'bytes' ? 'bytes' : 'count'} historical gapMs={data.bucketMs} color="green"/>
      <details className="secondary-facts"><summary>More recorded statistics</summary><Facts items={[["Missing articles",count(data.totals.missing)],["Undecodable articles",count(data.totals.undecodable)],["Average fetch speed",speed(data.totals.avgBytesPerSec)],["Average latency",data.totals.avgLatencyMs === null ? '—' : `${data.totals.avgLatencyMs.toLocaleString()} ms`],["Earliest retained activity",date(data.firstSeenAt)]]}/></details>
      <p className="caption">Server-recorded buckets, including activity while this app was closed. Gaps have no recorded samples; retention limits coverage.</p>
    </div>}
  </Section>;
}
