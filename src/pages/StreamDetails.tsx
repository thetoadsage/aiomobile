import { useEffect, useRef, useState } from 'react';
import type { LiveStreams } from '../api/types';
import type { Resource } from '../hooks/useData';
import { request } from '../api/client';
import { bytes, speed, date, duration, count } from '../lib/format';
import type { FilePositions } from '../lib/streams';
import { Badge, Facts, Empty, Section, Status } from '../components/UI';
import { Chart } from '../components/Chart';
export function StreamDetails({ positions, id, resource, base, loginUrl }: { positions: FilePositions; id:string; resource:Resource<LiveStreams>; base:string; loginUrl:string }) {
  const [confirm,setConfirm] = useState(false);
  const [pending,setPending] = useState(false);
  const [error,setError] = useState('');
  const [stopped,setStopped] = useState(false);
  const stream = resource.data?.streams.find(s => s.id === id);
  const dialog=useRef<HTMLDivElement>(null);
  const hasStream=Boolean(stream);
  useEffect(()=>{
    if(!confirm || !hasStream)return;
    const previous=document.activeElement as HTMLElement | null;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==='Escape' && !dialog.current?.querySelector<HTMLButtonElement>('.danger')?.disabled){event.preventDefault();setConfirm(false);}
      if(event.key==='Tab'){
        const controls=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
        if(!controls.length){event.preventDefault();return;}
        const first=controls[0],last=controls.at(-1)!;
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',keydown);
    return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',keydown);previous?.focus();};
  },[confirm,hasStream]);
  async function stop() {
    setPending(true); setError('');
    try { await request(base, `/streams/sessions/${encodeURIComponent(id)}`, undefined, 'DELETE'); setStopped(true); setConfirm(false); resource.refresh(); }
    catch(e) { setError(e instanceof Error ? e.message : 'Unable to stop stream.'); }
    finally { setPending(false); }
  }
  if (!stream || stopped) return <><h1>Stream details</h1><Status resource={resource} loginUrl={loginUrl}/>{!resource.loading && <Empty title={stopped ? 'Stream stopped' : resource.data ? 'Stream has ended' : 'Stream unavailable'}>Return to Streams for current activity.</Empty>}</>;
  const pct = positions.get(stream.id)?.percent;
  return <><div className="intro"><h1 className="filename">{stream.filename || 'Unnamed stream'}</h1><p>{stream.username}</p></div><Status resource={resource} loginUrl={loginUrl}/><div className="stream-badges"><Badge>{stream.transport === 'usenet' ? 'Usenet' : 'Proxy'}</Badge><Badge state={stream.activity}>{stream.activity}</Badge></div><Section title="Live speed"><div className="card chart-card"><strong className="big-value">{speed(stream.bytesPerSec)}</strong><Chart points={resource.samples.flatMap(p => { const s=p.value.streams.find(s=>s.id===id); return s ? [{at:p.at,value:s.bytesPerSec}] : []; })} label="Bytes per second" rate/></div></Section><div className="card"><Facts items={[
    ['Bytes served',bytes(stream.bytesServed)],['File size',bytes(stream.size)],['Furthest file position',pct === undefined ? 'Unavailable' : `${pct.toFixed(1)}%`],['Started',date(stream.startedAt)],['Active reads',count(stream.activeReads)],['Idle time',duration(stream.idleMs)],
  ]}/><details className="secondary-facts"><summary>Connection details</summary><Facts items={[["Requests",count(stream.requests)],["Client IP",stream.clientIp || 'Unavailable'],["Instance",stream.instanceId]]}/></details></div><p className="caption">Furthest file position is the highest percentage observed during this visit. It stays visible between reads and does not decrease after backward seeks. Buffering, seeks or checks near the end can put it ahead of playback. It resets when the session ends or you reload the app. Bytes served includes rereads.</p><button className="danger full" onClick={()=>setConfirm(true)}>Stop stream</button>{confirm && <div className="modal-backdrop"><div ref={dialog} className="card modal" role="alertdialog" aria-modal="true" aria-busy={pending} aria-labelledby="stop-title"><h2 id="stop-title">Stop this stream?</h2><p>Playback for {stream.username} will be interrupted.</p><p className="filename">{stream.filename || 'Unnamed stream'}</p>{error && <p role="alert" className="red">{error}</p>}<div className="modal-actions"><button autoFocus disabled={pending} onClick={()=>setConfirm(false)}>Keep streaming</button><button className="danger" disabled={pending} onClick={()=>void stop()}>{pending ? 'Stopping…' : 'Stop stream'}</button></div></div></div>}</>;
}
