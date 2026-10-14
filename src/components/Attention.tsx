import { useEffect, useState } from 'react';
import type { LiveStats, UsenetStatsOverview } from '../api/types';
import type { Resource } from '../hooks/useData';
import { collectAttention } from '../lib/attention';
import { dismissAttention, isAttentionDismissed, readAttentionDismissals, reconcileAttentionDismissals, writeAttentionDismissals } from '../lib/attentionDismissals';
import { Icon } from './Icon';
import { Status } from './UI';
export function Attention({ usenet, stats, loginUrl, base }: { usenet: Resource<LiveStats>; stats: Resource<UsenetStatsOverview>; loginUrl: string; base:string }) {
  const [dismissals,setDismissals]=useState(readAttentionDismissals);
  const [dismissedCount,setDismissedCount]=useState(0);
  const scope=base || location.origin;
  const allItems = collectAttention(usenet.data?.pool.providers ?? [], stats.data);
  const items=allItems.filter(item=>!isAttentionDismissed(item,scope,dismissals));
  const unavailable = Boolean(usenet.error || stats.error || usenet.mode === 'disconnected' || stats.mode === 'disconnected');
  const loading = usenet.loading || stats.loading;
  useEffect(()=>{
    if(loading || unavailable || !usenet.data || !stats.data || document.hidden)return;
    const current=collectAttention(usenet.data.pool.providers,stats.data);
    const known=[...usenet.data.pool.providers.map(p=>`provider:${p.id}`),...stats.data.indexers.map(i=>`indexer:${i.indexer}`)];
    setDismissals(previous=>{
      const next=reconcileAttentionDismissals(current,known,scope,previous);
      if(next!==previous)writeAttentionDismissals(next);
      return next;
    });
  },[usenet.data,stats.data,loading,unavailable,scope]);
  function dismiss(selected:typeof items) {
    setDismissals(previous=>{const next=dismissAttention(selected,scope,previous);writeAttentionDismissals(next);return next;});
    setDismissedCount(count=>count+selected.length);
    requestAnimationFrame(()=>{const target=document.querySelector<HTMLElement>('.attention-panel > summary') ?? document.getElementById('main');target?.focus();});
  }
  const feedback=<span className="sr-only" role="status">{dismissedCount ? `${dismissedCount} health alert${dismissedCount===1 ? '' : 's'} dismissed on this device this visit.` : ''}</span>;
  if (!items.length && !unavailable && !loading) return feedback;
  return <>{feedback}<div className={`attention-shell ${items.length ? 'attention-dismissible' : ''}`}><details className="attention-panel">
    <summary><span><i/>{items.length ? 'Needs attention' : unavailable ? 'Health checks unavailable' : 'Checking health…'}</span><small>{items.length ? `${items.length} source${items.length === 1 ? '' : 's'}` : 'Details'}</small><Icon name="arrow" size={16}/></summary>
    <div className="attention-body"><p className="caption">Provider activity now; provider rates and indexer outcomes over the last 24 hours.{unavailable ? ' Last received data may be stale.' : ''}</p>
      <Status resource={usenet} loginUrl={loginUrl}/><Status resource={stats} loginUrl={loginUrl}/>
      <ul>{items.map(item => <li key={item.id}><a href={item.href}><span><strong>{item.title}</strong><small>{item.details}</small></span><Icon name="arrow" size={16}/></a><button className="icon-button attention-item-dismiss" aria-label={`Dismiss alert for ${item.title}`} title={`Dismiss alert for ${item.title}`} onClick={()=>dismiss([item])}><Icon name="close" size={18}/></button></li>)}</ul>
      {items.length>0 && <p className="caption attention-dismiss-hint">Dismiss on this device for up to 24 hours. New or increased failures appear again.</p>}
    </div>
  </details>{items.length>0 && <button className="icon-button attention-dismiss" aria-label="Dismiss current health alerts" title="Dismiss current health alerts" onClick={()=>dismiss(items)}><Icon name="close" size={18}/></button>}</div></>;
}
