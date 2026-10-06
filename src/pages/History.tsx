import { useEffect, useState } from 'react';
import type { BandwidthOverview, BandwidthWindow, StreamHistoryRow } from '../api/types';
import { useData } from '../hooks/useData';
import type { Settings } from '../lib/settings';
import { bytes, date, duration, count } from '../lib/format';
import { historyDuration, periodLabel } from '../lib/usage';
import { Badge, Empty, Metric, Section, Status, Facts } from '../components/UI';
import { Chart } from '../components/Chart';
import { UsageGauge } from '../components/UsageGauge';
const seriesKey = (row: BandwidthOverview['seriesByUser'][number]) => JSON.stringify([row.username,row.aggregated === true]);
const seriesLabel = (row: BandwidthOverview['seriesByUser'][number]) => row.aggregated ? 'Other users (combined)' : row.username || 'Unidentified streams';
export function History({ settings, loginUrl }: { settings:Settings; loginUrl:string }) {
  const [bandwidthWindow,setWindow] = useState<BandwidthWindow>('24h');
  const [selectedUser,setSelectedUser] = useState('');
  const [search,setSearch] = useState('');
  const [username,setUsername] = useState('');
  const [transport,setTransport] = useState('');
  const [offset,setOffset] = useState(0);
  const [filters,setFilters] = useState({search:'',username:'',transport:''});
  useEffect(()=> { const timer=setTimeout(()=> {setFilters({search:search.trim(),username:username.trim(),transport});setOffset(0);},500);return()=>clearTimeout(timer); },[search,username,transport]);
  const query = new URLSearchParams({limit:'20',offset:String(offset)});
  if(filters.search) query.set('q',filters.search);
  if(filters.username) query.set('username',filters.username);
  if(filters.transport) query.set('transport',filters.transport);
  const bandwidth=useData<BandwidthOverview>(settings.baseUrl,`/streams/bandwidth?window=${bandwidthWindow}`,settings.historySeconds,true,false,1);
  const history=useData<{entries:StreamHistoryRow[];total:number}>(settings.baseUrl,`/streams/history?${query}`,settings.historySeconds,true,false,1);
  const data=bandwidth.data;
  const selectedSeries=data?.seriesByUser.find(row => seriesKey(row) === selectedUser) ?? data?.seriesByUser[0];
  const accountingWindow=bandwidthWindow === '30d' && data?.window === '30d';
  const windowLabel=bandwidthWindow === '30d' ? periodLabel(data) : bandwidthWindow.toUpperCase();
  return <><div className="intro"><h1>History & bandwidth</h1><p>Your usage over time.</p></div>
    <div className="segmented" aria-label="Bandwidth period">{(['24h','7d','30d'] as const).map(w=><button key={w} aria-pressed={w===bandwidthWindow} onClick={()=>setWindow(w)}>{w === '30d' ? 'Accounting period' : w.toUpperCase()}</button>)}</div>
    <Status resource={bandwidth} loginUrl={loginUrl}/>
    <div className="metrics"><Metric label="Total bandwidth" value={bytes(data?.total)} icon="activity"/><Metric label="Usenet" value={bytes(data?.byTransport.usenet)} icon="download" tone="green"/><Metric label="Proxy" value={bytes(data?.byTransport.proxy)} icon="streams"/><Metric label="Period usage" value={bytes(data?.periodTotal)} icon="history" hint={data?.globalLimit ? `of ${bytes(data.globalLimit)} global limit` : data ? 'No global limit configured' : 'Waiting for usage'}/></div>
    {data && <div className="card period-usage"><strong>{periodLabel(data)}</strong><p className="caption">Since {date(data.periodStart)} · global limit accounting</p><UsageGauge used={data.periodTotal} limit={data.globalLimit} label="Global bandwidth used this accounting period"/></div>}
    <Section title="Usage over time" action={<span className="muted">{windowLabel}</span>}><div className="card chart-card"><Chart points={data?.series.map(p=>({at:p.bucketMs,value:p.bytes})) ?? []} label="Data served" historical gapMs={data?.bucketMs}/></div></Section>
    <Section title="User bandwidth trends" action={<span className="muted">{windowLabel}</span>}>
      {selectedSeries && data ? <div className="card chart-card user-trends"><div className="filters"><label>User or group<select value={seriesKey(selectedSeries)} onChange={event => setSelectedUser(event.target.value)}>{data.seriesByUser.map(row => <option key={seriesKey(row)} value={seriesKey(row)}>{seriesLabel(row)}</option>)}</select></label></div><Chart points={selectedSeries.series.map(point => ({at:point.bucketMs,value:point.bytes}))} label={`Data served: ${seriesLabel(selectedSeries)}`} historical gapMs={data.bucketMs}/><p className="caption">{selectedSeries.aggregated ? 'Combined activity for users outside the server’s individual series limit.' : 'Recorded bandwidth for this user in the selected window.'} Gaps have no recorded buckets.</p></div> : data && <Empty title="No user trend samples">The server has no retained per-user buckets in this window.</Empty>}
    </Section>
    <Section title="Top users"><div className="card user-list">{data?.byUser.slice().sort((a,b)=>b.bytes-a.bytes).slice(0,10).map(u=><details className="user-usage" key={u.username}><summary><span>{u.username || 'Unidentified streams'}<small>{u.limit ? `Limit ${bytes(u.limit)}` : 'Unlimited bandwidth'}{u.connectionLimit ? ` · ${u.connectionLimit} connections max` : ''}</small></span><strong>{bytes(u.bytes)}</strong></summary>{accountingWindow ? <UsageGauge used={u.bytes} limit={u.limit} label={`Bandwidth used by ${u.username || 'unidentified streams'} this accounting period`}/> : <p className="caption">Select Accounting period to compare usage with this user’s limit.</p>}</details>)}{data && !data.byUser.length && <p className="muted">No user bandwidth recorded.</p>}</div></Section>
    <Section title="Recent streams"><div className="filters"><label>Search filename<input value={search} placeholder="Search history…" onChange={e=>setSearch(e.target.value)}/></label><div className="filter-row"><label>Username<input value={username} placeholder="All users" onChange={e=>setUsername(e.target.value)}/></label><label>Transport<select aria-label="Transport" value={transport} onChange={e=>setTransport(e.target.value)}><option value="">All transports</option><option value="usenet">Usenet</option><option value="proxy">Proxy</option></select></label></div></div>
      <Status resource={history} loginUrl={loginUrl}/>
      <div className="stack">{history.data?.entries.map(s=>{const span=historyDuration(s);return <div className="card history-card" key={s.id}><h3>{s.filename || 'Unnamed stream'}</h3><p>{s.username || 'Unidentified streams'} · {date(s.startedAt)}</p><div className="stream-badges"><Badge>{s.transport === 'usenet' ? 'Usenet' : 'Proxy'}</Badge><Badge>{s.endReason || 'Ended'}</Badge><span className="stream-speed">{bytes(s.bytesServed)}</span></div><details className="secondary-facts"><summary>Session details</summary><Facts items={[["Session span",span === undefined ? 'Unavailable' : duration(span)],["Requests",count(s.requests)],["Last activity",date(s.lastSeenAt)],["Ended",s.endedAt === undefined ? 'Not recorded' : date(s.endedAt)]]}/><p className="caption">Session span runs from start to recorded end, or last activity when no end is recorded. It can include pauses and idle time.</p></details></div>;})}{history.data && !history.data.entries.length && <Empty title="No matching history">Try a different filter or wait for a stream to finish.</Empty>}</div>
      <div className="pagination"><button disabled={!offset || history.loading} onClick={()=>setOffset(Math.max(0,offset-20))}>Previous</button><span>{history.data?.total ? `${offset+1}–${Math.min(offset+20,history.data.total)} of ${history.data.total}` : '0 results'}</span><button disabled={history.loading || !history.data || offset+20>=history.data.total} onClick={()=>setOffset(offset+20)}>Next</button></div>
    </Section>
  </>;
}
