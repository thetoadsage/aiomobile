import { useState } from 'react';
import type { LiveStreams } from '../api/types';
import type { Resource } from '../hooks/useData';
import { Section, Empty, Status } from '../components/UI';
import { StreamList } from '../components/StreamList';
import { StreamCapacity } from '../components/StreamCapacity';
import { selectStreams, type StreamSort } from '../lib/streams';
export function Streams({ resource, loginUrl, open }: { resource: Resource<LiveStreams>; loginUrl: string; open: (id:string) => void }) {
  const [filter,setFilter] = useState('all');
  const [query,setQuery] = useState('');
  const [sort,setSort] = useState<StreamSort>('recent');
  const streams = resource.data ? selectStreams(resource.data.streams, query, filter, sort) : undefined;
  const filtered = Boolean(query.trim() || filter !== 'all');
  return <><div className="intro"><h1>Streams</h1><p>Follow every session.</p></div><Status resource={resource} loginUrl={loginUrl}/>
    <StreamCapacity snapshot={resource.data}/>
    <div className="stream-controls"><label>Search streams<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Filename or username" autoComplete="off"/></label>
      <div className="segmented" aria-label="Filter transport">{['all','usenet','proxy'].map(f => <button key={f} aria-pressed={filter===f} onClick={() => setFilter(f)}>{f === 'all' ? 'All streams' : f === 'usenet' ? 'Usenet' : 'Proxy'}</button>)}</div>
      <label className="sort-control">Sort streams<select value={sort} onChange={event => setSort(event.target.value as StreamSort)}><option value="recent">Newest first</option><option value="throughput">Highest throughput</option><option value="oldest">Oldest first</option></select></label>
    </div>
    <Section title={filtered ? `${streams?.length ?? '—'} matching streams` : `${streams?.length ?? '—'} active streams`} action={filtered ? <button className="text-button" onClick={() => {setQuery('');setFilter('all');}}>Clear filters</button> : undefined}>
      <StreamList streams={streams ?? []} open={open}/>
      {streams && !streams.length && <Empty title={filtered ? 'No matching streams' : 'No active streams'}>{filtered ? 'Try another filename, username, or transport.' : 'There’s no playback right now.'}</Empty>}
    </Section></>;
}
