import type { LiveStats, UsenetStatsOverview } from '../api/types';
import type { Resource } from '../hooks/useData';
import { collectAttention } from '../lib/attention';
import { Icon } from './Icon';
import { Status } from './UI';
export function Attention({ usenet, stats, loginUrl }: { usenet: Resource<LiveStats>; stats: Resource<UsenetStatsOverview>; loginUrl: string }) {
  const items = collectAttention(usenet.data?.pool.providers ?? [], stats.data);
  const unavailable = Boolean(usenet.error || stats.error || usenet.mode === 'disconnected' || stats.mode === 'disconnected');
  const loading = usenet.loading || stats.loading;
  if (!items.length && !unavailable && !loading) return null;
  return <details className="attention-panel">
    <summary><span><i/>{items.length ? 'Needs attention' : unavailable ? 'Health checks unavailable' : 'Checking health…'}</span><small>{items.length ? `${items.length} source${items.length === 1 ? '' : 's'}` : 'Details'}</small><Icon name="arrow" size={16}/></summary>
    <div className="attention-body"><p className="caption">Provider activity now; provider rates and indexer outcomes over the last 24 hours.{unavailable ? ' Last received data may be stale.' : ''}</p>
      <Status resource={usenet} loginUrl={loginUrl}/><Status resource={stats} loginUrl={loginUrl}/>
      <ul>{items.map(item => <li key={item.id}><a href={item.href}><span><strong>{item.title}</strong><small>{item.details}</small></span><Icon name="arrow" size={16}/></a></li>)}</ul>
    </div>
  </details>;
}
