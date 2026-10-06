import { useState } from 'react';
import type { AddonAnalytics, AddonRange } from '../api/usageTypes';
import { useData } from '../hooks/useData';
import type { Settings } from '../lib/settings';
import { count } from '../lib/format';
import { Empty, Facts, Section, Status } from '../components/UI';
import { Pagination } from '../components/Pagination';
export function Addons({ settings, loginUrl }: { settings: Settings; loginUrl: string }) {
  const [range,setRange] = useState<AddonRange>('24h');
  const [search,setSearch] = useState('');
  const [sort,setSort] = useState<'errors' | 'latency' | 'requests'>('errors');
  const [offset,setOffset] = useState(0);
  const resource = useData<AddonAnalytics>(settings.baseUrl,`/analytics/addons?range=${range}`,settings.historySeconds,true,false,1,true);
  const rows = resource.data?.addons.filter(row => row.presetId.toLowerCase().includes(search.trim().toLowerCase())).slice().sort((a,b) => (sort === 'latency' ? (b.avgLatencyMs ?? -1)-(a.avgLatencyMs ?? -1) : sort === 'requests' ? b.requests-a.requests : b.errorRate-a.errorRate) || b.requests-a.requests || a.presetId.localeCompare(b.presetId)) ?? [];
  // The supported server's 30d path returns all daily rollups. Expose that truth as All.
  return <><div className="intro"><h1>Addon health</h1><p>Recorded requests, errors, and stream-search latency.</p></div>
    <div className="segmented" aria-label="Addon analytics period">{(['24h','7d','all'] as const).map(value => <button key={value} aria-pressed={range === value} onClick={() => {setRange(value);setOffset(0);}}>{value === 'all' ? 'All rollups' : value.toUpperCase()}</button>)}</div>
    {resource.error?.status === 404 ? <Empty title="Addon analytics is unavailable">This AIOStreams version does not expose addon analytics.<button onClick={resource.refresh}>Check again</button></Empty> : <>
      <Status resource={resource} loginUrl={loginUrl}/>
      {resource.data && <div className="card addon-summary"><Facts items={[["Preset requests",count(resource.data.total)],["Custom URL requests",count(resource.data.customEndpoints)]]}/><p className="caption">Custom URL requests are counted separately; per-addon results below cover preset URLs.</p></div>}
      <p className="caption">{range === 'all' ? 'All retained daily rollups; this is not a fixed 30-day window.' : 'Recent recorded events; collection and retention settings may shorten coverage.'} These results are separate from Usenet providers and indexer imports.</p>
      <Section title="Addon results"><div className="filters"><label>Search addons<input type="search" value={search} onChange={event => {setSearch(event.target.value);setOffset(0);}} placeholder="Preset name…"/></label><label>Sort addons<select value={sort} onChange={event => {setSort(event.target.value as typeof sort);setOffset(0);}}><option value="errors">Highest error rate</option><option value="latency">Slowest average response</option><option value="requests">Most requests</option></select></label></div>
        <div className="stack">{rows.slice(offset,offset+20).map((row,index) => <article className="card addon-card" key={`${row.presetId}:${index}`}>
          <h3>{row.presetId || 'Unnamed preset'}</h3>
          <Facts items={[["Requests",count(row.requests)],["Recorded errors",count(row.errors)],["Error rate",row.requests ? `${row.errorRate.toFixed(1)}%` : 'No requests'],["Average latency",row.avgLatencyMs === null ? 'Unavailable' : `${row.avgLatencyMs.toLocaleString()} ms`]]}/>
          <details className="secondary-facts"><summary>Request share &amp; error details</summary><Facts items={[["Preset request share",resource.data?.total ? `${row.share.toFixed(1)}%` : 'No requests'],...Object.entries(row.errorKinds).sort((a,b) => b[1]-a[1]).map(([kind,value]) => [`Error: ${kind}`,count(value)] as [string,string])]}/>{!Object.keys(row.errorKinds).length && <p className="caption">No error kinds recorded.</p>}</details>
        </article>)}</div>
        {resource.data && !rows.length && <Empty title={search.trim() ? 'No matching addons' : 'No addon requests recorded'}>{search.trim() ? 'Try another preset name.' : 'Requests appear when AIOStreams collects addon activity. An empty window does not prove every addon is healthy.'}</Empty>}
        <Pagination offset={offset} total={rows.length} busy={resource.loading || !!resource.refreshing} change={setOffset}/>
      </Section>
    </>}<p className="caption">Read-only monitoring. Opening this view does not call or test addons.</p>
  </>;
}
