import { useState } from 'react';
import type { UsenetStatsOverview, UsenetWindow } from '../api/types';
import type { Resource } from '../hooks/useData';
import { bytes, count, date, speed } from '../lib/format';
import { usenetWindowLabel } from '../lib/usage';
import { RecordedChart } from './RecordedChart';
import { Facts, Section, Status } from './UI';
import { UsenetWindowPicker } from './UsenetWindowPicker';
export function UsenetHistory({ stats, window, change, loginUrl }: { stats: Resource<UsenetStatsOverview>; window: UsenetWindow; change: (window: UsenetWindow) => void; loginUrl: string }) {
  const [metric,setMetric] = useState<'bytes' | 'articles' | 'errors'>('bytes');
  const data = stats.data;
  const labels = {bytes:'Data fetched',articles:'Articles fetched',errors:'Fetch errors'};
  const errorBuckets = data?.throughput.filter(point => point.errors > 0).slice().sort((a,b) => b.bucketMs - a.bucketMs) ?? [];
  const from = data ? window === 'all' ? Math.min(data.generatedAt, ...data.throughput.map(point => point.bucketMs)) : data.generatedAt - (window === '24h' ? 1 : window === '7d' ? 7 : 30) * 86400000 : 0;
  const errorRows = (rows: typeof errorBuckets) => rows.map(point => <li key={point.bucketMs}><span>{date(point.bucketMs)}</span><strong>{count(point.errors)} {point.errors === 1 ? 'error' : 'errors'}</strong></li>);
  return <Section title="Recorded activity" action={<span className="muted">{usenetWindowLabel(window)}</span>}>
    <UsenetWindowPicker window={window} change={change}/>
    <Status resource={stats} loginUrl={loginUrl}/>
    {data && <div className="card chart-card usenet-history">
      <Facts items={[["Data fetched",bytes(data.totals.bytes)],["Articles fetched",count(data.totals.articles)],["Fetch errors",count(data.totals.errors)]]}/>
      <div className="segmented" aria-label="Recorded activity metric">{(['bytes','articles','errors'] as const).map(value => <button key={value} aria-pressed={value === metric} onClick={() => setMetric(value)}>{value === 'bytes' ? 'Data' : value === 'articles' ? 'Articles' : 'Errors'}</button>)}</div>
      {metric === 'errors' ? <div className="recorded-errors"><p className="caption">Fetch errors by recorded bucket</p>{errorBuckets.length ? <><ul>{errorRows(errorBuckets.slice(0,8))}</ul>{errorBuckets.length > 8 && <details><summary>Earlier error buckets ({count(errorBuckets.length - 8)})</summary><ul>{errorRows(errorBuckets.slice(8))}</ul></details>}</> : <p className="muted">No fetch errors in recorded buckets.</p>}</div> : <RecordedChart points={data.throughput.map(point => ({at:point.bucketMs,value:point[metric]}))} label={labels[metric]} unit={metric === 'bytes' ? 'bytes' : 'count'} bucketMs={data.bucketMs} from={from} to={data.generatedAt} color="green"/>}
      <details className="secondary-facts"><summary>More recorded statistics</summary><Facts items={[["Missing articles",count(data.totals.missing)],["Undecodable articles",count(data.totals.undecodable)],["Average fetch speed",speed(data.totals.avgBytesPerSec)],["Average latency",data.totals.avgLatencyMs === null ? '—' : `${data.totals.avgLatencyMs.toLocaleString()} ms`],["Earliest retained activity",date(data.firstSeenAt)]]}/></details>
      <p className="caption">Server-recorded activity includes time while this app was closed. Retention and resets can limit history; bucket totals can differ from the summary at window boundaries.</p>
    </div>}
  </Section>;
}
