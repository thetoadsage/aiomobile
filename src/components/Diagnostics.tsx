import { useState } from 'react';
import { clearDiagnostics, useDiagnostics } from '../lib/diagnostics';
export function Diagnostics() {
  const [open,setOpen]=useState(false);
  return <section className="section"><button className="text-button" aria-expanded={open} onClick={()=>setOpen(!open)}>{open ? 'Hide' : 'Show'} diagnostics</button>{open && <DiagnosticList/>}</section>;
}
function DiagnosticList() {
  const entries=useDiagnostics();
  return <div className="card diagnostics"><div className="section-heading"><h2>Local diagnostics</h2><button className="text-button" onClick={clearDiagnostics}>Clear</button></div><p className="caption">Last 80 events in memory only. No telemetry, credentials, request URLs or response content. Cleared when the app closes.</p>{entries.length ? <ol>{entries.slice().reverse().map((entry,index)=><li key={`${entry.at}-${index}`}><time>{new Date(entry.at).toLocaleTimeString()}</time><span>{entry.source} · {entry.event}{entry.status ? ` (${entry.status})` : ''}</span></li>)}</ol> : <p>No diagnostic events yet.</p>}</div>;
}
