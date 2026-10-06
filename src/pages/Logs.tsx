import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LogQuery } from '../api/logTypes';
import { ApiError } from '../api/client';
import { downloadLogs } from '../api/logs';
import { Sheet } from '../components/Sheet';
import { Icon } from '../components/Icon';
import { LOG_CAP, LOG_LEVELS, logQuery, type LogEntry } from '../lib/logs';
import type { Settings } from '../lib/settings';
import { useLogs } from '../hooks/useLogs';
const EMPTY_FILTERS:LogQuery={levels:[],modules:[],regex:false};
export function Logs({settings,loginUrl,reportConnection}:{settings:Settings;loginUrl:string;reportConnection:(mode:string)=>void}) {
  const [filters,setFilters]=useState<LogQuery>(EMPTY_FILTERS);
  const [search,setSearch]=useState('');
  const [sheet,setSheet]=useState(false);
  const [modules,setModules]=useState<string[]>([]);
  const layout=useRef<HTMLDivElement>(null);
  const discoverModules=useCallback((names:string[])=>setModules(previous=>[...new Set([...previous,...names])].sort().slice(0,100)),[]);
  useEffect(()=>setModules([]),[settings.baseUrl]);
  useEffect(()=>{const timer=setTimeout(()=>setFilters(f=>({...f,q:search.trim()})),350);return()=>clearTimeout(timer);},[search]);
  useEffect(()=>{
    const viewport=window.visualViewport;
    const resize=()=>{
      const el=layout.current;if(!el || !viewport)return;
      // Include notices above the viewer and Safari's smaller keyboard viewport.
      const bottom=Math.min(viewport.height+viewport.offsetTop,document.querySelector('.bottom-nav')?.getBoundingClientRect().top ?? innerHeight);
      const height=`${Math.max(190,Math.floor(bottom-el.getBoundingClientRect().top-16))}px`;
      if(el.style.height!==height)el.style.height=height;
    };
    const observer=new ResizeObserver(resize);const main=document.getElementById('main');if(main)observer.observe(main);
    viewport?.addEventListener('resize',resize);viewport?.addEventListener('scroll',resize);resize();
    return()=>{observer.disconnect();viewport?.removeEventListener('resize',resize);viewport?.removeEventListener('scroll',resize);};
  },[]);
  const key=logQuery(filters);
  let invalid=false;try{if(filters.regex && filters.q)new RegExp(filters.q,'i');}catch{invalid=true;}
  const filterCount=(filters.levels?.length || 0)+(filters.modules?.length || 0);
  return <div ref={layout} className="logs-layout"><div className="logs-toolbar"><div className="logs-heading"><div><h1>Logs</h1></div><button className="log-filter-button" aria-label={`Log filters${filterCount ? ` (${filterCount})` : ''}`} onClick={()=>setSheet(true)}><Icon name="filter" size={18}/>Filters{filterCount>0 && <span>{filterCount}</span>}</button></div><label className="log-search"><span className="sr-only">Search logs</span><input type="search" value={search} placeholder="Search messages or metadata" onChange={e=>setSearch(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false}/></label></div>{invalid ? <div role="alert" className="notice error">Invalid regular expression. Edit your search or turn off regex.</div> : <LogSession key={`${settings.baseUrl}|${key}`} settings={settings} query={key} filters={filters} loginUrl={loginUrl} discoverModules={discoverModules} reportConnection={reportConnection}/>}{sheet && <FilterSheet filters={filters} modules={modules} apply={value=>{setFilters({...value,q:search.trim()});setSheet(false);}} close={()=>setSheet(false)}/>}</div>;
}
function FilterSheet({filters,modules,apply,close}:{filters:LogQuery;modules:string[];apply:(value:LogQuery)=>void;close:()=>void}) {
  const [draft,setDraft]=useState(filters);
  const toggle=(key:'levels'|'modules',value:string)=>setDraft(f=>({...f,[key]:(f[key] || []).includes(value) ? f[key]?.filter(v=>v!==value) : [...f[key] || [],value]}));
  return <Sheet title="Log filters" close={close}><fieldset><legend>Levels</legend><div className="log-filter-grid">{LOG_LEVELS.map(level=><label key={level}><input type="checkbox" checked={draft.levels?.includes(level) || false} onChange={()=>toggle('levels',level)}/><span className={`log-level ${level}`}>{level}</span></label>)}</div></fieldset><fieldset><legend>Modules</legend><div className="log-module-options">{[...new Set([...modules,...draft.modules || []])].sort().map(module=><label key={module}><input type="checkbox" checked={draft.modules?.includes(module) || false} onChange={()=>toggle('modules',module)}/>{module}</label>)}</div>{!modules.length && <p className="caption">Module names appear as logs are received.</p>}</fieldset><details><summary className="log-advanced">Advanced search</summary><label className="toggle"><span>Regular expression</span><input type="checkbox" checked={draft.regex || false} onChange={e=>setDraft(f=>({...f,regex:e.target.checked}))}/></label></details><div className="modal-actions"><button onClick={()=>setDraft({...EMPTY_FILTERS,q:filters.q})}>Reset filters</button><button className="primary" onClick={()=>apply(draft)}>Apply filters</button></div></Sheet>;
}
function LogSession({settings,query,filters,loginUrl,discoverModules,reportConnection}:{settings:Settings;query:string;filters:LogQuery;loginUrl:string;discoverModules:(value:string[])=>void;reportConnection:(mode:string)=>void}) {
  const resource=useLogs(settings.baseUrl,query,settings.pollingSeconds);
  useEffect(()=>reportConnection(resource.mode),[resource.mode,reportConnection]);
  const [menu,setMenu]=useState(false);
  const [confirm,setConfirm]=useState(false);
  const [pending,setPending]=useState(false);
  const [actionError,setActionError]=useState<ApiError>();
  const [announcement,setAnnouncement]=useState('');
  const [newCount,setNewCount]=useState(0);
  const scroller=useRef<HTMLDivElement>(null);
  const follow=useRef(true);
  const anchor=useRef<{seq:string;offset:number} | undefined>(undefined);
  const lastSeen=useRef(0);
  const exporter=useRef<AbortController | undefined>(undefined);
  const isAuth=[resource.error,actionError].some(error=>error && [401,403].includes(error.status));
  useEffect(()=>()=>exporter.current?.abort(),[]);
  useEffect(()=>{const names=[...new Set(resource.rows.flatMap(row=>row.module ? [row.module] : []))].sort();if(names.length)discoverModules(names);},[resource.rows,discoverModules]);
  useLayoutEffect(()=>{
    const el=scroller.current;if(!el)return;
    const fresh=resource.rows.filter(row=>row.seq>lastSeen.current).length;
    lastSeen.current=resource.rows.at(-1)?.seq ?? 0;
    if(follow.current && !resource.paused){el.scrollTop=el.scrollHeight;setNewCount(0);}
    else {
      // Preserve the entry being read when oldest rows are evicted (including WebKit).
      const entry=anchor.current && el.querySelector<HTMLElement>(`[data-seq="${anchor.current.seq}"]`);
      if(entry && anchor.current)el.scrollTop+=entry.getBoundingClientRect().top-el.getBoundingClientRect().top-anchor.current.offset;
      if(fresh)setNewCount(n=>Math.min(LOG_CAP,n+fresh));
    }
  },[resource.rows,resource.paused]);
  const jump=()=>{follow.current=true;setNewCount(0);const el=scroller.current;if(el)el.scrollTop=el.scrollHeight;};
  const pause=()=>{if(resource.paused){follow.current=true;setNewCount(0);}resource.togglePause();};
  const scrolled=()=>{
    const el=scroller.current;if(!el)return;
    follow.current=el.scrollHeight-el.scrollTop-el.clientHeight<48;
    if(follow.current){anchor.current=undefined;setNewCount(0);return;}
    const top=el.getBoundingClientRect().top;let low=0,high=el.children.length-1;
    while(low<high){const mid=Math.floor((low+high)/2);if(el.children[mid].getBoundingClientRect().bottom<=top+1)low=mid+1;else high=mid;}
    const entry=el.children[low] as HTMLElement | undefined;
    if(entry?.dataset.seq)anchor.current={seq:entry.dataset.seq,offset:entry.getBoundingClientRect().top-top};
  };
  const clear=async()=>{
    setPending(true);setActionError(undefined);
    try{await resource.clear();setConfirm(false);setNewCount(0);follow.current=true;setAnnouncement('Retained logs cleared. Live tail continues.');}
    catch(error){setActionError(error instanceof ApiError ? error : new ApiError('Unable to clear logs.'));}
    finally{setPending(false);}
  };
  const exportLogs=async(format:'log'|'json')=>{
    setPending(true);setActionError(undefined);exporter.current=new AbortController();
    try{await downloadLogs(settings.baseUrl,filters,format,exporter.current.signal);setAnnouncement('Filtered logs downloaded.');setMenu(false);}
    catch(error){if(!exporter.current.signal.aborted){const err=error instanceof ApiError ? error : new ApiError('Unable to export logs. Check your connection.');setActionError(err);if([401,403].includes(err.status))resource.reportError(err);}}
    finally{setPending(false);}
  };
  const error=resource.error || actionError;
  return <><div className="log-controls"><div className={`connection ${resource.mode==='Live' ? 'connected' : ''}`} role="status"><i/>{resource.mode}{resource.paused && <span className="log-paused">· Paused</span>}</div><button onClick={pause} disabled={isAuth} aria-pressed={resource.paused}>{resource.paused ? 'Resume' : 'Pause'}</button><button className="icon-button" aria-label="Log actions" onClick={()=>setMenu(true)}><Icon name="more" size={20}/></button></div>
    {error && <div className="notice error" role="alert"><div><strong>{isAuth ? 'Authentication expired' : 'Log updates unavailable'}</strong><p>{error.message}</p></div>{isAuth ? <a className="button" href={loginUrl}>Sign in</a> : <button onClick={()=>{setActionError(undefined);resource.refresh();}}>Retry</button>}</div>}
    {resource.fallback && !error && <div className="log-fallback" role="status">REST fallback · live connection reconnecting</div>}
    <div className="log-list-wrap"><div ref={scroller} className="log-list card" role="region" aria-label="Log entries" tabIndex={0} onScroll={scrolled}>
      {resource.loading ? <div className="log-empty" role="status"><span className="spinner"/>Loading recent logs…</div> : !resource.rows.length ? <div className="log-empty"><Icon name="logs" size={26}/><strong>{filters.q || filters.levels?.length || filters.modules?.length ? 'No matching logs' : 'No retained logs'}</strong><p>{resource.paused ? 'Resume to show received entries.' : 'New matching entries will appear here.'}</p></div> : resource.rows.map(row=><LogRow key={row.seq} row={row} announce={setAnnouncement}/>)}</div>
      {(!follow.current && newCount>0 || resource.paused && resource.buffered>0) && <button className="new-logs" onClick={resource.paused ? pause : jump}>{resource.paused ? resource.buffered : newCount} new logs <span>↓ {resource.paused ? 'Resume' : 'Latest'}</span></button>}
    </div><div className="log-footnote"><span>{resource.rows.length} entries · {LOG_CAP.toLocaleString()} max</span><span>{resource.dropped>0 ? 'Older entries trimmed' : 'In memory only'}</span></div><span className="sr-only" role="status">{announcement}</span>
    {menu && <Sheet title="Log actions" close={()=>setMenu(false)} busy={pending}><div className="log-actions"><button disabled={pending || isAuth} onClick={()=>void exportLogs('log')}>Export plain log</button><button disabled={pending || isAuth} onClick={()=>void exportLogs('json')}>Export JSON / NDJSON</button><button className="danger" disabled={pending || isAuth} onClick={()=>{setActionError(undefined);setMenu(false);setConfirm(true);}}>Clear retained logs…</button></div>{pending && <p role="status">Downloading filtered logs…</p>}{actionError && <p className="red" role="alert">{actionError.message}</p>}</Sheet>}
    {confirm && <Sheet title="Clear retained AIOStreams logs?" close={()=>setConfirm(false)} busy={pending}><p>This removes all logs in the server’s in-memory retained buffer, including entries outside your filters. Other viewers will also lose that retained history. Live logging continues.</p>{actionError && <p className="red" role="alert">{actionError.message}</p>}<div className="modal-actions"><button disabled={pending} onClick={()=>setConfirm(false)}>Keep logs</button><button className="danger" disabled={pending || isAuth} onClick={()=>void clear()}>{pending ? 'Clearing…' : 'Clear retained logs'}</button></div></Sheet>}
  </>;
}
const LogRow=memo(function LogRow({row,announce}:{row:LogEntry;announce:(message:string)=>void}) {
  const [open,setOpen]=useState(false);
  const time=Number.isFinite(row.ts) ? new Date(row.ts).toLocaleTimeString([], {hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}) : 'Unknown time';
  const copy=async(full:boolean)=>{try{await navigator.clipboard.writeText(full ? row.line : row.message);announce(full ? 'Full log entry copied.' : 'Message copied.');}catch{announce('Copy unavailable. Select the text in entry details.');}};
  return <article className="log-row" data-seq={row.seq}><button className="log-entry" aria-expanded={open} aria-label={`${time} ${row.level} ${row.module || 'app'}: ${row.message}`} onClick={()=>setOpen(value=>!value)}><span className="log-entry-meta"><time title={Number.isFinite(row.ts) ? new Date(row.ts).toLocaleString() : undefined}>{time}</time><span className={`log-level ${LOG_LEVELS.includes(row.level as typeof LOG_LEVELS[number]) ? row.level : 'info'}`}>{row.level}</span><span className="log-module">{row.module || 'app'}</span><Icon name="arrow" size={12}/></span><span className="log-message">{row.message}</span></button>{open && <div className="log-details"><small>Sequence {row.seq} · {Number.isFinite(row.ts) ? new Date(row.ts).toLocaleString() : 'Timestamp unavailable'}</small>{Object.keys(row.metadata).length>0 && <pre>{JSON.stringify(row.metadata,null,2)}</pre>}<div><button onClick={()=>void copy(false)}>Copy message</button><button onClick={()=>void copy(true)}>Copy full entry</button></div></div>}</article>;
});
