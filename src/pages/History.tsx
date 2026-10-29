import { useState } from 'react';
import type { BandwidthOverview, BandwidthWindow } from '../api/types';
import { useData } from '../hooks/useData';
import type { Settings } from '../lib/settings';
import { bytes, date } from '../lib/format';
import { periodLabel } from '../lib/usage';
import { Empty, Metric, Section, Status } from '../components/UI';
import { RecordedChart } from '../components/RecordedChart';
import { UsageGauge } from '../components/UsageGauge';
const seriesKey = (row: BandwidthOverview['seriesByUser'][number]) => JSON.stringify([row.username,row.aggregated === true]);
const seriesLabel = (row: BandwidthOverview['seriesByUser'][number]) => row.aggregated ? 'Other users (combined)' : row.username || 'Unidentified streams';
export function History({ settings, loginUrl }: { settings:Settings; loginUrl:string }) {
  const [bandwidthWindow,setWindow] = useState<BandwidthWindow>('24h');
  const [selectedUser,setSelectedUser] = useState('');
  const bandwidth=useData<BandwidthOverview>(settings.baseUrl,`/streams/bandwidth?window=${bandwidthWindow}`,settings.historySeconds,true,false,1);

  const data=bandwidth.data;
  const selectedSeries=data?.seriesByUser.find(row => seriesKey(row) === selectedUser) ?? data?.seriesByUser[0];
  const accountingWindow=bandwidthWindow === '30d' && data?.window === '30d';
  const windowLabel=bandwidthWindow === '30d' ? periodLabel(data) : bandwidthWindow.toUpperCase();
  return <><div className="intro"><h1>History & bandwidth</h1><p>Your usage over time.</p></div>
    <div className="segmented" aria-label="Bandwidth period">{(['24h','7d','30d'] as const).map(w=><button key={w} aria-pressed={w===bandwidthWindow} onClick={()=>setWindow(w)}>{w === '30d' ? 'Accounting period' : w.toUpperCase()}</button>)}</div>
    <Status resource={bandwidth} loginUrl={loginUrl}/>
    <div className="metrics"><Metric label="Total bandwidth" value={bytes(data?.total)} icon="activity"/><Metric label="Usenet" value={bytes(data?.byTransport.usenet)} icon="download" tone="green"/><Metric label="Proxy" value={bytes(data?.byTransport.proxy)} icon="streams"/><Metric label="Period usage" value={bytes(data?.periodTotal)} icon="history" hint={data?.globalLimit ? `of ${bytes(data.globalLimit)} global limit` : data ? 'No global limit configured' : 'Waiting for usage'}/></div>
    {data && <div className="card period-usage"><strong>{periodLabel(data)}</strong><p className="caption">Since {date(data.periodStart)} · global limit accounting</p><UsageGauge used={data.periodTotal} limit={data.globalLimit} label="Global bandwidth used this accounting period"/></div>}
    <Section title="Usage over time" action={<span className="muted">{windowLabel}</span>}><div className="card chart-card">{data && <RecordedChart points={data.series.map(p=>({at:p.bucketMs,value:p.bytes}))} label="Data served" bucketMs={data.bucketMs} from={data.sinceMs} to={data.generatedAt}/>}</div></Section>
    <Section title="User bandwidth trends" action={<span className="muted">{windowLabel}</span>}>
      {selectedSeries && data ? <div className="card chart-card user-trends"><div className="filters"><label>User or group<select value={seriesKey(selectedSeries)} onChange={event => setSelectedUser(event.target.value)}>{data.seriesByUser.map(row => <option key={seriesKey(row)} value={seriesKey(row)}>{seriesLabel(row)}</option>)}</select></label></div><RecordedChart points={selectedSeries.series.map(point => ({at:point.bucketMs,value:point.bytes}))} label={`Data served: ${seriesLabel(selectedSeries)}`} bucketMs={data.bucketMs} from={data.sinceMs} to={data.generatedAt}/><p className="caption">{selectedSeries.aggregated ? 'Combined activity for users outside the server’s individual series limit.' : 'Recorded bandwidth for this user in the selected window.'} Retained bucket totals may differ from summary/accounting totals.</p></div> : data && <Empty title="No user trend samples">The server has no retained per-user buckets in this window.</Empty>}
    </Section>
    <Section title="Top users"><div className="card user-list">{data?.byUser.slice().sort((a,b)=>b.bytes-a.bytes).slice(0,10).map(u=><details className="user-usage" key={u.username}><summary><span>{u.username || 'Unidentified streams'}<small>{u.limit ? `Limit ${bytes(u.limit)}` : 'Unlimited bandwidth'}{u.connectionLimit ? ` · ${u.connectionLimit} connections max` : ''}</small></span><strong>{bytes(u.bytes)}</strong></summary>{accountingWindow ? <UsageGauge used={u.bytes} limit={u.limit} label={`Bandwidth used by ${u.username || 'unidentified streams'} this accounting period`}/> : <p className="caption">Select Accounting period to compare usage with this user’s limit.</p>}</details>)}{data && !data.byUser.length && <p className="muted">No user bandwidth recorded.</p>}</div></Section>
  </>;
}
