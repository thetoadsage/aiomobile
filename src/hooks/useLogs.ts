import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, endpoint, request } from '../api/client';
import type { LogSnapshot } from '../api/logTypes';
import { LOG_CAP, mergeLogs, parseLog, type LogEntry } from '../lib/logs';
import { diagnose } from '../lib/diagnostics';
export type LogMode = 'Connecting' | 'Live' | 'Reconnecting' | 'Offline';

// Dedicated incremental feed; snapshot monitoring hooks expect a different SSE wire shape.
export function useLogs(base: string, query: string, pollingSeconds: number) {
  const [rows,setRows]=useState<LogEntry[]>([]);
  const [loading,setLoading]=useState(true);
  const [mode,setMode]=useState<LogMode>('Connecting');
  const [fallback,setFallback]=useState(false);
  const [error,setError]=useState<ApiError>();
  const [paused,setPaused]=useState(false);
  const [buffered,setBuffered]=useState(0);
  const [dropped,setDropped]=useState(0);
  const [stats,setStats]=useState<LogSnapshot['bufferStats']>();
  const actions=useRef<{refresh:()=>void;toggle:()=>void;clear:()=>Promise<void>;fail:(error:unknown)=>void}>({refresh:()=>{},toggle:()=>{},clear:async()=>{},fail:()=>{}});
  const refresh=useCallback(()=>actions.current.refresh(),[]);
  const togglePause=useCallback(()=>actions.current.toggle(),[]);
  const clear=useCallback(()=>actions.current.clear(),[]);
  const reportError=useCallback((error:unknown)=>actions.current.fail(error),[]);

  useEffect(()=>{
    let active=true, suspended=false, busy=false, initialized=false, isPaused=false;
    let source:EventSource | undefined, controller:AbortController | undefined;
    let visible:LogEntry[]=[], pending:LogEntry[]=[], cursor=0, epoch=0, discarded=0;
    let lostAt=0, nextPoll=0, lastAttempt=0, polling=false;
    const interval=Math.max(30,pollingSeconds)*1000;
    const usable=()=>active && !suspended && navigator.onLine && !document.hidden;
    setRows([]);setLoading(true);setError(undefined);setPaused(false);setBuffered(0);setDropped(0);setStats(undefined);setFallback(false);
    const publish=()=>{
      if(!active)return;
      if(discarded){const count=discarded;setDropped(n=>n+count);discarded=0;}
      if(isPaused){setBuffered(pending.length);return;}
      if(!pending.length)return;
      const dropped=Math.max(0,visible.length+pending.length-LOG_CAP);
      if(dropped) setDropped(n=>n+dropped);
      visible=mergeLogs(visible,pending);pending=[];setRows(visible);setBuffered(0);
    };
    const accept=(entries:LogEntry[])=>{
      if(!entries.length) return;
      // Both REST and accepted SSE records are monotonic; avoid sorting every event.
      pending.push(...entries);
      const overflow=Math.max(0,pending.length-LOG_CAP);
      if(overflow){discarded+=overflow;pending.splice(0,overflow);}
    };
    const fail=(err:unknown)=>{
      const apiError=err instanceof ApiError ? err : new ApiError('Unable to load logs. Check your connection.');
      setError(apiError);
      if([401,403].includes(apiError.status)) { suspended=true;source?.close();controller?.abort();setMode('Offline');setFallback(false); }
    };
    const connect=()=>{
      if(!usable() || !initialized || source && source.readyState!==EventSource.CLOSED) return;
      lastAttempt=Date.now();lostAt=Date.now();setMode('Reconnecting');
      source=new EventSource(endpoint(base,`/logs/stream?${query}&since=${cursor}&limit=${LOG_CAP}&order=asc`),{withCredentials:true});
      source.onopen=()=>{if(!usable())return;lostAt=0;polling=false;setMode('Live');setFallback(false);setError(undefined);diagnose('SSE connected','Logs');};
      source.onmessage=event=>{
        if(!usable())return;
        const seq=Number(event.lastEventId);
        const entry=parseLog(seq,event.data);
        if(!entry) { diagnose('Live frame rejected','Logs');return; }
        if(seq<=cursor) return;
        cursor=seq;accept([entry]);
      };
      source.onerror=()=>{
        if(!usable())return;
        if(!lostAt)lostAt=Date.now();setMode('Reconnecting');diagnose('SSE disconnected','Logs');
        // Keep this EventSource alive so the browser sends Last-Event-ID on reconnect.
        // Probe once for authentication; further failed reconnects use bounded REST.
        if(Date.now()>=nextPoll) { nextPoll=Date.now()+interval;void snapshot(); }
      };
    };
    const snapshot=async()=>{
      if(!usable() || busy)return;
      busy=true;const requestController=new AbortController();controller=requestController;const requestEpoch=epoch,startCursor=cursor;
      const path=`/logs?${query}&limit=${initialized ? LOG_CAP : 200}&order=asc${initialized ? `&since=${cursor}` : ''}`;
      try {
        const data=await request<LogSnapshot>(base,path,requestController.signal);
        if(!active || requestEpoch!==epoch)return;
        // A process restart resets upstream sequences. A fresh snapshot recovers the cursor.
        if(data.nextSeq<startCursor) {cursor=0;visible=[];pending=[];setRows([]);setBuffered(0);initialized=false;source?.close();source=undefined;nextPoll=0;return;}
        setStats(data.bufferStats);setError(undefined);
        accept(data.logs.filter(row=>row.seq>cursor).flatMap(row=>{const entry=parseLog(row.seq,row.line,row);return entry ? [entry] : [];}));
        cursor=Math.max(cursor,data.nextSeq);initialized=true;publish();connect();
      } catch(err) {if(active && !requestController.signal.aborted) fail(err);}
      finally {if(active && controller===requestController){busy=false;setLoading(false);}}
    };
    actions.current={
      fail,
      refresh:()=>{if(!suspended){nextPoll=Date.now()+interval;void snapshot();}},
      toggle:()=>{isPaused=!isPaused;setPaused(isPaused);if(!isPaused)publish();},
      clear:async()=>{
        epoch++;controller?.abort();busy=false;
        try {
          const result=await request<{cleared:boolean}>(base,'/logs/clear',undefined,'POST',{confirm:true});
          if(result.cleared!==true)throw new ApiError('The server did not confirm clearing the retained buffer.');
          if(!active)return;
          epoch++;controller?.abort();busy=false;visible=[];pending=[];discarded=0;setRows([]);setBuffered(0);setDropped(0);setStats(undefined);setError(undefined);
        } catch(err) {if(active)fail(err);throw err;}
      },
    };
    const lifecycle=()=>{
      if(!navigator.onLine || document.hidden){source?.close();source=undefined;controller?.abort();setMode(navigator.onLine ? 'Reconnecting' : 'Offline');publish();}
      else if(usable()){nextPoll=Date.now()+interval;void snapshot();connect();}
    };
    const manual=()=>actions.current.refresh();
    const timer=setInterval(()=>{
      if(!usable())return;
      if(!initialized && Date.now()>=nextPoll) {nextPoll=Date.now()+interval;void snapshot();}
      if(lostAt && Date.now()-lostAt>=30000) {
        if(!polling){polling=true;setFallback(true);diagnose('REST fallback entered','Logs');}
        if(Date.now()>=nextPoll){nextPoll=Date.now()+interval;void snapshot();}
        if(source?.readyState===EventSource.CLOSED && Date.now()-lastAttempt>=60000)connect();
      }
    },5000);
    const flush=setInterval(publish,250);
    window.addEventListener('online',lifecycle);window.addEventListener('offline',lifecycle);document.addEventListener('visibilitychange',lifecycle);window.addEventListener('aiomobile:refresh',manual);
    nextPoll=Date.now()+interval;if(usable())void snapshot();else {setMode('Offline');setLoading(false);}
    return()=>{active=false;source?.close();controller?.abort();clearInterval(timer);clearInterval(flush);window.removeEventListener('online',lifecycle);window.removeEventListener('offline',lifecycle);document.removeEventListener('visibilitychange',lifecycle);window.removeEventListener('aiomobile:refresh',manual);};
  },[base,query,pollingSeconds]);
  return {rows,loading,mode,fallback,error,paused,buffered,dropped,stats,refresh,togglePause,clear,reportError};
}
