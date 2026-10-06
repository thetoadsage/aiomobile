import { useEffect, useState } from 'react';
import type { LibrarySnapshot } from '../api/monitoringTypes';
import { useData } from '../hooks/useData';
import type { Settings } from '../lib/settings';
import { bytes, count, date, duration } from '../lib/format';
import { Status, Empty, Badge, Facts } from '../components/UI';
import { Pagination } from '../components/Pagination';
const labels = {queued:'Queued',inspecting:'Inspecting',available:'Available',degraded:'Degraded',failed:'Failed',streaming:'Streaming'};
const origin = {playback:'Playback',dashboard:'Dashboard',sabnzbd:'Download client'};
export function Library({ settings, loginUrl }: { settings:Settings;loginUrl:string }) {
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState({q:'',status:''});
  const [offset,setOffset]=useState(0);
  useEffect(()=>{const timer=setTimeout(()=>{setFilter(v=>({...v,q:search.trim()}));setOffset(0);},500);return()=>clearTimeout(timer);},[search]);
  const params=new URLSearchParams({limit:'20',offset:String(offset),sort:'activity',dir:'desc'});
  if(filter.q)params.set('q',filter.q);
  if(filter.status)params.set('statuses',filter.status);
  const resource=useData<LibrarySnapshot>(settings.baseUrl,`/usenet/library?${params}`,settings.historySeconds);
  return <><div className="intro"><h1>Usenet library</h1><p>Imported releases, file availability, and rechecks.</p></div><div className="filters"><label>Search library<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Release name…"/></label><label>Library status<select value={filter.status} onChange={e=>{setFilter(v=>({...v,status:e.target.value}));setOffset(0);}}><option value="">All statuses</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div><Status resource={resource} loginUrl={loginUrl}/><div className="stack">{resource.data?.entries.map(entry=><article className="card library-entry" key={entry.nzbHash}><div className="library-heading"><h2>{entry.name || 'Unnamed release'}</h2><Badge state={entry.status==='failed' ? 'auth_failed' : entry.status==='degraded' ? 'paused' : entry.status==='available' || entry.status==='streaming' ? 'online' : ''}>{labels[entry.status]}</Badge>{entry.blocked && <Badge state="paused">Blocked</Badge>}</div><p>{entry.size===undefined ? 'Size unknown' : bytes(entry.size)} · {count(entry.files.length)} {entry.files.length===1 ? 'file' : 'files'} · {origin[entry.origin]}</p>{entry.failReason && <p className="orange">{entry.failReason}</p>}<details className="secondary-facts"><summary>Release details &amp; files</summary><Facts items={[
    ['Owner',entry.owner || '—'],['Added',date(Date.parse(entry.addedAt))],['Last used',date(Date.parse(entry.lastUsedAt))],['Import time',entry.importMs===undefined ? '—' : duration(entry.importMs)],['Failure count',count(entry.failCount)],['Last recheck',date(entry.lastCheckedAt)],['Next recheck',entry.nextCheckAt ? date(entry.nextCheckAt) : 'Not scheduled'],['Completed rechecks',count(entry.checkCount)],
    ...(entry.probedFiles===undefined || entry.probeableFiles===undefined ? [] : [['Files with media info',`${entry.probedFiles} / ${entry.probeableFiles}`] as [string,string]]),
  ]}/><ul className="library-files">{entry.files.slice(0,100).map((file,index)=><li key={index}><strong>{file.path || file.name || 'Unnamed file'}</strong><small>{bytes(file.size)}{file.category ? ` · ${file.category}` : ''}{file.streamable ? ' · Streamable' : ''}</small></li>)}</ul>{entry.files.length>100 && <p className="caption">Showing the first 100 files.</p>}{!entry.files.length && <p className="caption">No file list available.</p>}</details></article>)}{resource.data && !resource.data.entries.length && <Empty title="No matching releases">Try another search or status. Releases appear after AIOStreams imports them.</Empty>}</div><Pagination offset={offset} total={resource.data?.total ?? 0} busy={resource.loading || !!resource.refreshing} change={setOffset}/><p className="caption">Read-only view. Status is release availability, not playback or download progress.</p></>;
}
