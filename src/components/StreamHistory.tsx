import { useEffect, useState } from 'react';
import type { StreamHistoryRow } from '../api/types';
import { loadFilteredHistory } from '../api/streamHistory';
import type { FilteredHistoryPage } from '../api/streamHistory';
import { useData } from '../hooks/useData';
import type { Settings } from '../lib/settings';
import { bytes, date, duration, count } from '../lib/format';
import { historyDuration } from '../lib/usage';
import { Badge, Empty, Status, Facts } from './UI';

type HistorySnapshot = { entries: StreamHistoryRow[]; total: number };
type HistorySort = 'recent' | 'oldest';

export function StreamHistory({ settings, loginUrl, activeIds }: { settings: Settings; loginUrl: string; activeIds: string[] }) {
  const [search, setSearch] = useState('');
  const [username, setUsername] = useState('');
  const [transport, setTransport] = useState('');
  const [sort, setSort] = useState<HistorySort>('recent');
  const [filters, setFilters] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = new URLSearchParams();
      if (search.trim()) query.set('q', search.trim());
      if (username.trim()) query.set('username', username.trim());
      if (transport) query.set('transport', transport);
      setFilters(query.toString());
    }, 350);
    return () => clearTimeout(timer);
  }, [search, username, transport]);
  const filtered = Boolean(search || username || transport);
  return <section className="section stream-history" aria-labelledby="stream-history-heading">
    <div className="section-heading"><h2 id="stream-history-heading">Stream history</h2>{filtered && <button className="text-button" onClick={() => { setSearch(''); setUsername(''); setTransport(''); }}>Clear filters</button>}</div>
    <div className="stream-controls">
      <div className="filter-row"><label>Search filename<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Filename" autoComplete="off"/></label><label>Username<input type="search" value={username} onChange={event => setUsername(event.target.value)} placeholder="All users" autoComplete="off"/></label></div>
      <div className="segmented" aria-label="History transport">{['', 'usenet', 'proxy'].map(value => <button key={value} aria-pressed={transport === value} onClick={() => setTransport(value)}>{value === '' ? 'All' : value === 'usenet' ? 'Usenet' : 'Proxy'}</button>)}</div>
      <label className="sort-control">Sort history<select value={sort} onChange={event => setSort(event.target.value as HistorySort)}><option value="recent">Newest first</option><option value="oldest">Oldest first</option></select></label>
    </div>
    {settings.showAllTransfers
      ? <HistoryResults key={`${filters}:${sort}`} filters={filters} sort={sort} settings={settings} loginUrl={loginUrl} activeIds={activeIds}/>
      : <FilteredHistoryResults key={`${filters}:${sort}`} filters={filters} sort={sort} settings={settings} loginUrl={loginUrl} activeIds={activeIds}/>}

  </section>;
}

function HistoryResults({ filters, sort, settings, loginUrl, activeIds }: { filters: string; sort: HistorySort; settings: Settings; loginUrl: string; activeIds: string[] }) {
  const [page, setPage] = useState(0);
  // The API orders completed sessions newest-first. Read its count only when
  // reverse paging is needed, then request the matching slice from the end.
  const oldest = sort === 'oldest';
  const index = useData<HistorySnapshot>(settings.baseUrl, `/streams/history?${filters}&limit=1&offset=0`, settings.historySeconds, oldest, false, 1);
  const total = index.data?.total ?? 0;
  const offset = oldest ? Math.max(0, total - (page + 1) * 20) : page * 20;
  const limit = oldest ? Math.max(1, Math.min(20, total - page * 20)) : 20;
  const history = useData<HistorySnapshot>(settings.baseUrl, `/streams/history?${filters}&limit=${limit}&offset=${offset}`, settings.historySeconds, !oldest || Boolean(index.data), false, 1);
  const entries = history.data?.entries.filter(stream => !activeIds.includes(stream.id));
  const rows = oldest ? entries?.slice().reverse() : entries;
  const resultTotal = oldest ? total : history.data?.total ?? 0;
  useEffect(() => {
    if (history.data && page > 0 && page * 20 >= resultTotal) setPage(Math.max(0, Math.ceil(resultTotal / 20) - 1));
  }, [history.data, page, resultTotal]);
  return <>
    {oldest && <Status resource={index} loginUrl={loginUrl}/>}
    {(!oldest || index.data) && <Status resource={history} loginUrl={loginUrl}/>}
    <HistoryCards rows={rows}/>{rows && !rows.length && <Empty title="No matching history">Try a different filter or wait for a stream to finish.</Empty>}
    <div className="pagination"><button disabled={!page || history.loading} onClick={() => setPage(value => Math.max(0, value - 1))}>Previous</button><span>{resultTotal ? `${page * 20 + 1}–${Math.min((page + 1) * 20, resultTotal)} of ${resultTotal}` : '0 results'}</span><button disabled={history.loading || !history.data || (page + 1) * 20 >= resultTotal} onClick={() => setPage(value => value + 1)}>Next</button></div>
  </>;
}

function FilteredHistoryResults({ filters, sort, settings, loginUrl, activeIds }: { filters: string; sort: HistorySort; settings: Settings; loginUrl: string; activeIds: string[] }) {
  const [cursors, setCursors] = useState([0]);
  const page = cursors.length - 1;
  const history = useData<FilteredHistoryPage>(settings.baseUrl, `/streams/history?${filters}&_sort=${sort}&_cursor=${cursors[page]}`, settings.historySeconds, true, false, 1, false, loadFilteredHistory);
  const rows = history.data?.entries.filter(stream => !activeIds.includes(stream.id));
  const busy = history.loading || history.refreshing;
  return <>
    <Status resource={history} loginUrl={loginUrl}/>
    <HistoryCards rows={rows}/>
    {rows && !rows.length && <Empty title={history.data?.hasMore ? 'No larger transfers in these records' : 'No matching history'}>{history.data?.hasMore ? 'Choose Next to check more history, or enable Show all transfers under More → Settings.' : 'Try a different filter or enable Show all transfers under More → Settings.'}</Empty>}
    {history.data && <p className="caption">{history.data.hidden} tiny transfer{history.data.hidden === 1 ? '' : 's'} hidden in {history.data.scanned} checked records.{history.data.hasMore && !rows?.length ? ' More history is available.' : ''}</p>}
    <div className="pagination"><button disabled={!page || busy} onClick={() => setCursors(value => value.slice(0, -1))}>Previous</button><span>Page {page + 1}</span><button disabled={busy || Boolean(history.error) || !history.data?.hasMore} onClick={() => { const next = history.data?.nextCursor; if (next !== undefined) setCursors(value => [...value, next]); }}>Next</button></div>
  </>;
}

function HistoryCards({ rows }: { rows?: StreamHistoryRow[] }) {
  return <div className="stack">{rows?.map(s=>{const span=historyDuration(s);return <div className="card history-card" key={s.id}><h3>{s.filename || 'Unnamed stream'}</h3><p>{s.username || 'Unidentified streams'} · {date(s.startedAt)}</p><div className="stream-badges"><Badge>{s.transport === 'usenet' ? 'Usenet' : 'Proxy'}</Badge><Badge>{s.endReason || 'Ended'}</Badge><span className="stream-speed">{bytes(s.bytesServed)}</span></div><details className="secondary-facts"><summary>Session details</summary><Facts items={[["Session span",span === undefined ? 'Unavailable' : duration(span)],["Requests",count(s.requests)],["Last activity",date(s.lastSeenAt)],["Ended",s.endedAt === undefined ? 'Not recorded' : date(s.endedAt)]]}/><p className="caption">Session span runs from start to recorded end, or last activity when no end is recorded. It can include pauses and idle time.</p></details></div>;})}</div>;
}
