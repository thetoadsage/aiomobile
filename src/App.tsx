import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BandwidthOverview, LiveStats, LiveStreams, UsenetStatsOverview, UsenetWindow } from './api/types';
import { applyTheme } from './lib/themes';
import { diagnose } from './lib/diagnostics';
import { useData } from './hooks/useData';
import { loadSettings, type Settings as Preferences } from './lib/settings';
import { Icon, type IconName } from './components/Icon';
import { BrandMark } from './components/BrandMark';
import { Overview } from './pages/Overview';
import { Streams } from './pages/Streams';
import { StreamDetails } from './pages/StreamDetails';
import { Usenet } from './pages/Usenet';
import { ProviderDetails } from './pages/ProviderDetails';
import { History } from './pages/History';
import { Indexers } from './pages/Indexers';
import { Settings } from './pages/Settings';
import { Logs } from './pages/Logs';
import { Library } from './pages/Library';
import { MediaInfo } from './pages/MediaInfo';
import { BackgroundTasks } from './pages/BackgroundTasks';
import { Addons } from './pages/Addons';
import type { SystemMetrics } from './api/monitoringTypes';
import type { LogSnapshot } from './api/logTypes';
const navigation: { id:string; label:string; icon:IconName }[] = [
  {id:'overview',label:'Overview',icon:'overview'},{id:'streams',label:'Streams',icon:'streams'},
  {id:'usenet',label:'Usenet',icon:'usenet'},{id:'logs',label:'Logs',icon:'logs'},{id:'more',label:'More',icon:'more'},
];
function route() { const value=location.hash.slice(1) || 'overview'; return /^(overview|streams|usenet|logs|history|more|settings|library|media-info|background-tasks|addons|indexers|indexers\/[^/]+|stream\/[^/]+|provider\/[^/]+)$/.test(value) ? value : 'overview'; }
const go = (value:string) => { location.hash = value; };
export default function App() {
  const [page,setPage]=useState(route);
  const currentRoute=useRef(page);
  const backRoute=useRef<{page:string;target:string} | undefined>(undefined);
  const [settings,setSettings]=useState<Preferences>(loadSettings);
  useLayoutEffect(() => {
    applyTheme(settings.theme);
    if (settings.theme !== 'system') return;
    const media = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => applyTheme('system');
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [settings.theme]);
  const [offline,setOffline]=useState(!navigator.onLine);
  const [connection,setConnection]=useState('Connecting');
  const [logConnection,setLogConnection]=useState('Connecting');
  const reportLogs=useCallback((value:string)=>setLogConnection(value),[]);
  const [pull,setPull]=useState(0);
  const [update,setUpdate]=useState<ServiceWorkerRegistration>();
  const touchStart=useRef<number | null>(null);
  const reportConnection=useCallback((value:string)=>setConnection(value),[]);
  const instanceOrigin=settings.baseUrl ? new URL(settings.baseUrl).origin : location.origin;
  const loginUrl=`${instanceOrigin}/login?next=${encodeURIComponent(instanceOrigin===location.origin ? '/mobile/' : '/dashboard')}`;
  useEffect(()=> { const onHash=()=>{const next=route();if(next.startsWith('stream/') || next.startsWith('provider/') || next.startsWith('indexers/'))backRoute.current={page:next,target:currentRoute.current};currentRoute.current=next;setPage(next);};window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash); },[]);
  useLayoutEffect(()=>{window.scrollTo(0,0);},[page]);
  useEffect(()=> {const online=()=>setOffline(!navigator.onLine);window.addEventListener('online',online);window.addEventListener('offline',online);return()=>{window.removeEventListener('online',online);window.removeEventListener('offline',online);};},[]);
  useEffect(()=> {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let active=true;
    let controllerWasPresent = Boolean(navigator.serviceWorker.controller);
    let updateRequested=false;
    const changed=()=>{if(controllerWasPresent && updateRequested)location.reload();controllerWasPresent=true;};
    const requestUpdate=()=>{updateRequested=true;};
    window.addEventListener('aiomobile:update',requestUpdate);
    navigator.serviceWorker.addEventListener('controllerchange',changed);
    let registration:ServiceWorkerRegistration | undefined;
    const checkUpdate=()=>{if(!document.hidden && navigator.onLine)void registration?.update?.().catch(()=>{});};
    const updateTimer=setInterval(checkUpdate,3600000);
    document.addEventListener('visibilitychange',checkUpdate);
    void navigator.serviceWorker.register('/mobile/sw.js',{scope:'/mobile/'}).then(reg=> {
      if (!active) return;
      registration=reg;
      const ready=()=>{setUpdate(reg);diagnose('Service worker update ready','App');};
      if(reg.waiting) ready();
      reg.addEventListener('updatefound',()=>{ const worker=reg.installing; worker?.addEventListener('statechange',()=>{if(active && worker.state==='installed' && navigator.serviceWorker.controller)ready();}); });
    }).catch(()=>diagnose('Service worker unavailable','App'));
    return()=>{active=false;navigator.serviceWorker.removeEventListener('controllerchange',changed);window.removeEventListener('aiomobile:update',requestUpdate);clearInterval(updateTimer);document.removeEventListener('visibilitychange',checkUpdate);};
  },[]);
  const refresh=()=>window.dispatchEvent(new Event('aiomobile:refresh'));
  const detail=page.startsWith('stream/') || page.startsWith('provider/') || page.startsWith('indexers/');
  const secondary=detail || ['settings','indexers','history','library','media-info','background-tasks','addons'].includes(page);
  let id=''; try {id=decodeURIComponent(page.split('/')[1] || '');} catch { /* invalid link shows unavailable state */ }
  const activeTab=page.startsWith('stream/') ? 'streams' : page.startsWith('provider/') ? 'usenet' : (['settings','indexers','history','library','media-info','background-tasks','addons'].includes(page) || page.startsWith('indexers/')) ? 'more' : page;
  const shownConnection=page==='logs' ? logConnection : connection;
  const live=shownConnection==='Live' && !offline;
  return <div className={`app ${page==='logs' ? 'logs-page' : ''} ${settings.compact ? 'compact' : ''} ${settings.reducedMotion ? 'reduced-motion' : ''}`}><a className="skip-link" href="#main" onClick={event=>{event.preventDefault();document.getElementById('main')?.focus();}}>Skip to content</a><header className="topbar"><div className="topbar-inner">{secondary ? <button className="icon-button" aria-label="Back" onClick={()=>go(backRoute.current?.page===page ? backRoute.current.target : page.startsWith('stream/') ? 'streams' : page.startsWith('provider/') ? 'usenet' : page.startsWith('indexers/') ? 'indexers' : 'more')}><Icon name="back"/></button> : <a className="brand" href="#overview"><BrandMark/><span>AIO<span className="brand-light">Mobile</span></span></a>}<div className={`connection ${live ? 'connected' : ''}`} role="status"><i/>{offline ? 'Offline' : shownConnection}</div><button className="icon-button refresh-button" aria-label="Refresh dashboard" onClick={page==='history' ? ()=>window.dispatchEvent(new Event('aiomobile:refresh')) : refresh}><Icon name="refresh" size={20}/></button></div></header><main id="main" tabIndex={-1} className="main" onTouchStart={e=>{touchStart.current=page!=='logs' && window.scrollY<=0 ? e.touches[0].clientY : null;}} onTouchMove={e=>{if(touchStart.current !== null) setPull(Math.min(100,Math.max(0,e.touches[0].clientY-touchStart.current)));}} onTouchEnd={()=>{if(pull>75){if(page==='history')window.dispatchEvent(new Event('aiomobile:refresh'));else refresh();}setPull(0);touchStart.current=null;}} onTouchCancel={()=>{setPull(0);touchStart.current=null;}}>
    {pull>20 && <div className="pull-indicator">{pull>75 ? 'Release to refresh' : 'Pull to refresh'}</div>}{offline && <div className="notice" role="status">You’re offline. Previously received data may be outdated.</div>}{update && <div className="notice">A new version of AIOMobile is available.<button onClick={()=>{diagnose('Service worker update requested','App');window.dispatchEvent(new Event('aiomobile:update'));update.waiting?.postMessage({type:'SKIP_WAITING'});}}>Update</button></div>}
    <div className={`page page-${page.split('/')[0]}`}>
      <LivePages page={page} settings={settings} id={id} loginUrl={loginUrl} reportConnection={reportConnection} save={setSettings}/>
      {page==='logs' && <Logs settings={settings} loginUrl={loginUrl} reportConnection={reportLogs}/>}
      {page==='library' && <Library settings={settings} loginUrl={loginUrl}/>}
      {page==='media-info' && <MediaInfo settings={settings} loginUrl={loginUrl}/>}
      {page==='addons' && <Addons settings={settings} loginUrl={loginUrl}/>}
      {page==='background-tasks' && <BackgroundTasks settings={settings} loginUrl={loginUrl}/>}
      {page==='history' && <History settings={settings} loginUrl={loginUrl}/>}
      {(page==='indexers' || page.startsWith('indexers/')) && <IndexerPage key={page} settings={settings} loginUrl={loginUrl} selected={page.startsWith('indexers/') ? id : undefined}/>}
      {page==='settings' && <Settings settings={settings} save={setSettings}/>}
      {page==='more' && <><div className="intro"><h1>More</h1><p>A few useful things, close at hand.</p></div><div className="card menu">{[{title:'History & Bandwidth',description:'Usage trends and recent streams',icon:'history' as const,page:'history'},{title:'Indexers',description:'Grab outcomes and import health',icon:'indexers' as const,page:'indexers'},{title:'Addon health',description:'Requests, errors, and search latency',icon:'activity' as const,page:'addons'},{title:'Background tasks',description:'Failures, running work, and scheduled runs',icon:'history' as const,page:'background-tasks'},{title:'Usenet Library',description:'Release availability, files, and rechecks',icon:'library' as const,page:'library'},{title:'Media Info',description:'Probe activity and stored tracks',icon:'media' as const,page:'media-info'},{title:'Settings',description:'Connection, charts, and preferences',icon:'settings' as const,page:'settings'}].map(item=><button key={item.page} onClick={()=>go(item.page)}><span className="menu-icon"><Icon name={item.icon}/></span><span><strong>{item.title}</strong><small>{item.description}</small></span><Icon name="arrow" size={18}/></button>)}</div><div className="card about"><span className="app-icon">A</span><h2>AIOMobile</h2><p>Your instance. In your pocket.</p><small>v0.1.0 · Built for AIOStreams</small><a href={loginUrl} className="text-button">Open AIOStreams sign-in →</a></div></>}
    </div><footer className="page-footer">AIOMobile <span>·</span> {settings.baseUrl ? new URL(settings.baseUrl).host : 'Same-origin connection'}</footer></main><nav className="bottom-nav" aria-label="Main navigation"><div>{navigation.map(item=><a href={`#${item.id}`} key={item.id} aria-current={activeTab===item.id ? 'page' : undefined}><Icon name={item.icon}/><span>{item.label}</span></a>)}</div></nav></div>;
}

const StreamPage=memo(Streams);
const StreamDetailPage=memo(StreamDetails);
const UsenetPage=memo(Usenet);
const ProviderPage=memo(ProviderDetails);
const openStream=(id:string)=>go(`stream/${encodeURIComponent(id)}`);
const openProvider=(id:string)=>go(`provider/${encodeURIComponent(id)}`);
const showStreams=()=>go('streams');
// SSE frames stay below the shell; only connection mode changes reach App.
function LivePages({page,settings,id,loginUrl,reportConnection,save}:{page:string;settings:Preferences;id:string;loginUrl:string;reportConnection:(value:string)=>void;save:(value:Preferences)=>void}) {
  const [usenetWindow,setUsenetWindow]=useState<UsenetWindow>('24h');
  const streams=useData<LiveStreams>(settings.baseUrl,'/streams/live',settings.pollingSeconds,true,true,settings.chartPoints);
  const usenet=useData<LiveStats>(settings.baseUrl,'/usenet/live',settings.pollingSeconds,true,true,settings.chartPoints);
  const bandwidth=useData<BandwidthOverview>(settings.baseUrl,'/streams/bandwidth?window=30d',settings.historySeconds,page==='overview');
  const stats=useData<UsenetStatsOverview>(settings.baseUrl,`/usenet/stats?window=${page==='overview' ? '24h' : usenetWindow}`, settings.historySeconds,page==='overview' || page==='usenet' || page.startsWith('provider/'),false,1);
  const system=useData<SystemMetrics>(settings.baseUrl,'/system',settings.pollingSeconds,page==='overview',true,1);
  const warnings=useData<LogSnapshot>(settings.baseUrl,'/logs?order=desc&limit=5&level=error,warn,fatal',settings.historySeconds,page==='overview',false,1);
  useEffect(()=>{
    const modes=[streams.mode,usenet.mode];
    reportConnection(modes.every(m=>m==='live') ? 'Live' : modes.includes('disconnected') ? 'Reconnecting' : modes.includes('polling') ? 'REST fallback' : 'Connecting');
  },[streams.mode,usenet.mode,reportConnection]);
  if(page==='overview')return <Overview system={system} warnings={warnings} streams={streams} usenet={usenet} bandwidth={bandwidth} loginUrl={loginUrl} open={openStream} navigate={showStreams} stats={stats} settings={settings} save={save}/>;
  if(page==='streams')return <StreamPage resource={streams} loginUrl={loginUrl} open={openStream}/>;
  if(page.startsWith('stream/'))return <StreamDetailPage key={id} id={id} resource={streams} base={settings.baseUrl} loginUrl={loginUrl}/>;
  if(page==='usenet')return <UsenetPage resource={usenet} stats={stats} window={usenetWindow} changeWindow={setUsenetWindow} loginUrl={loginUrl} open={openProvider}/>;
  if(page.startsWith('provider/'))return <ProviderPage key={id} id={id} resource={usenet} stats={stats} window={usenetWindow} changeWindow={setUsenetWindow} loginUrl={loginUrl}/>;
  return null;
}
function IndexerPage({settings,loginUrl,selected}:{settings:Preferences;loginUrl:string;selected?:string}) {
  const [statsWindow,setStatsWindow]=useState<UsenetWindow>('24h');
  const stats=useData<UsenetStatsOverview>(settings.baseUrl,`/usenet/stats?window=${statsWindow}`,settings.historySeconds,true,false,1);
  return <Indexers resource={stats} window={statsWindow} setWindow={setStatsWindow} loginUrl={loginUrl} selected={selected}/>;
}
