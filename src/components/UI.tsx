import { useEffect, useState, type ReactNode } from 'react';
import type { Resource } from '../hooks/useData';
import { duration } from '../lib/format';
import { Icon, type IconName } from './Icon';
export function Metric({ label, value, icon, hint, tone = 'blue' }: { label: string; value: string; icon: IconName; hint?: string; tone?: string }) {
  return <div className="card metric"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon name={icon} size={19}/></span></div><strong>{value}</strong>{hint && <small>{hint}</small>}</div>;
}
export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) { return <section className="section"><div className="section-heading"><h2>{title}</h2>{action}</div>{children}</section>; }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="card empty"><Icon name="activity" size={28}/><h3>{title}</h3><p>{children}</p></div>; }
export function Badge({ children, state = '' }: { children: ReactNode; state?: string }) { return <span className={`badge ${state}`}>{children}</span>; }
function Freshness({at}:{at?:number}) {
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),5000);return()=>clearInterval(timer);},[]);
  return at ? <small>Updated {duration(now-at)} ago · may be stale</small> : null;
}
export function Status<T>({ resource, loginUrl }: { resource: Resource<T>; loginUrl: string }) {
  if (resource.loading) return <div className="skeletons" role="status" aria-label="Loading monitoring data"><div/><div/></div>;
  if (resource.error) return <div className="notice error" role="alert"><div><strong>{[401,403].includes(resource.error.status) ? 'Authentication expired' : resource.data ? 'Updates unavailable' : 'Unable to load'}</strong><p>{resource.error.message}</p><Freshness at={resource.updatedAt}/></div>{[401,403].includes(resource.error.status) ? <a className="button" href={loginUrl}>Sign in</a> : <button onClick={resource.refresh}>Retry</button>}</div>;
  if(resource.refreshing && resource.data) return <span className="refresh-hint" role="status">Refreshing…</span>;
  if (resource.mode === 'polling') return <div className="notice" role="status"><div>REST fallback · live connection reconnecting.<br/><Freshness at={resource.updatedAt}/></div></div>;
  if(resource.mode==='disconnected' && resource.data) return <div className="notice" role="status"><div>Connection lost. Showing the last snapshot.<br/><Freshness at={resource.updatedAt}/></div></div>;
  return null;
}
export function Facts({ items }: { items: [string, ReactNode][] }) { return <dl className="facts">{items.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>; }
