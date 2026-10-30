import type { LiveStats, UsenetStatsOverview } from '../api/types';
import type { Resource } from '../hooks/useData';
import { count, speed } from '../lib/format';
import { providerHealth } from '../lib/health';
import { Icon } from './Icon';
import { Section } from './UI';

export function ProviderConnections({ resource, stats, open }: {
  resource: Resource<LiveStats>;
  stats?: UsenetStatsOverview;
  open: (id: string) => void;
}) {
  const pool = resource.data?.pool;
  // Priority belongs to the stats snapshot, not the live pool. Never infer it
  // from pool order or a historical row for a removed/reconfigured provider.
  const groups = new Map<string, { priority?: number; backup: boolean; providers: LiveStats['pool']['providers'] }>();
  for (const provider of pool?.providers ?? []) {
    const stat = stats?.providers.find(row => row.id === provider.id && !row.removed && row.isBackup === provider.isBackup);
    const priority = stat && Number.isSafeInteger(stat.priority) && stat.priority >= 0 ? stat.priority : undefined;
    const key = `${provider.isBackup}:${priority ?? 'unknown'}`;
    const group = groups.get(key) ?? { priority, backup: provider.isBackup, providers: [] };
    group.providers.push(provider);
    groups.set(key, group);
  }
  const orderedGroups = [...groups.values()].sort((a, b) => Number(a.backup) - Number(b.backup) || (a.priority ?? Infinity) - (b.priority ?? Infinity));
  const regularGroups = orderedGroups.filter(group => !group.backup && group.priority !== undefined);
  const stale = !!resource.error || resource.mode === 'disconnected' || resource.mode === 'background';
  return <Section title="Live connections" action={<span className="muted">{pool ? count(pool.providers.length) : '—'} providers</span>}>
    <div className="provider-connections">
      {pool && <p className="connections-summary">
        {stale && 'Last snapshot · '}{count(pool.globalDownloadsOnWire)} on the wire · {count(Math.max(0, pool.globalDownloadsInUse - pool.globalDownloadsOnWire))} queued with capacity
        {pool.globalDownloadsWaiting > 0 && ` · ${count(pool.globalDownloadsWaiting)} waiting for capacity`}
      </p>}
      {!pool ? <p>{resource.loading ? 'Loading provider connections…' : 'Provider connections unavailable.'}</p>
        : !pool.providers.length ? <p>No providers in the pool. Connections open on demand.</p>
        : <>
          {orderedGroups.map(group => {
            const rank = regularGroups.indexOf(group);
            const role = group.backup ? 'Backup' : group.priority === undefined ? 'Providers' : rank === 0 ? 'Primary' : rank === 1 ? 'Secondary' : 'Provider group';
            return <section className="card connection-group" aria-label={`${role} · ${group.priority === undefined ? 'Priority unavailable' : `Priority ${group.priority}`}`} key={`${group.backup}:${group.priority ?? 'unknown'}`}>
              <header className="connection-group-header">
              <h3>{role} · {group.priority === undefined ? 'Priority unavailable' : `Priority ${group.priority}`}</h3>
              {group.priority !== undefined && group.providers.length > 1 && <p className="caption">Load balanced · {count(group.providers.length)} providers</p>}
              </header>
              <ul className="connection-list">
                {group.providers.map(provider => {
                  const stat = stats?.providers.find(row => row.id === provider.id);
                  const health = providerHealth(provider, stat);
                  const name = provider.name || stat?.name || stat?.host || provider.id;
                  const tone = stale ? 'muted' : health.warnings.length ? 'orange' : health.state === 'active' ? 'green' : 'muted';
                  const scale = (value: number) => `scaleX(${provider.max > 0 ? Math.max(0, Math.min(1, value / provider.max)) : 0})`;
                  return <li key={provider.id}>
                    <button className="connection-row" onClick={() => open(provider.id)}>
                      <span className="connection-name"><strong>{name}</strong>{provider.isBackup && <small>Backup</small>}</span>
                      <span className="connection-speed"><strong>{speed(provider.throughput)}</strong><small>{stale || !provider.acquired ? 'Last sample /conn' : 'Per connection'}</small></span>
                      <span className={`connection-state ${tone}`}><i aria-hidden="true"/>{health.label}{health.warnings.length > 0 && <span> · {health.warnings.length} {health.warnings.length === 1 ? 'warning' : 'warnings'}</span>}</span>
                      <span className="connection-bar" aria-hidden="true">
                        <span className="connection-open" style={{transform: scale(provider.total)}}/>
                        <span className="connection-used" style={{transform: scale(provider.acquired)}}/>
                      </span>
                      <span className="connection-counts">{count(provider.acquired)} in use · {count(provider.total)} open · {count(provider.max)} max{provider.queued > 0 && ` · ${count(provider.queued)} queued`}</span>
                      <Icon name="arrow" size={16}/>
                    </button>
                  </li>;
                })}
              </ul>
            </section>;
          })}
          <p className="connection-legend"><span><i className="legend-used" aria-hidden="true"/>In use</span><span><i className="legend-open" aria-hidden="true"/>Open, including idle</span></p>
        </>}
    </div>
  </Section>;
}
