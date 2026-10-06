import type { ProviderPoolInfo, UsenetProviderStatRow } from '../api/types';
export function providerHealth(pool: ProviderPoolInfo, stats?: UsenetProviderStatRow) {
  const disabled = pool.state === 'disabled' || stats?.enabled === false;
  // Throughput is an EWMA and may remain nonzero after connections go idle.
  const state = disabled ? 'disabled' : pool.acquired > 0 || pool.queued > 0 ? 'active' : 'idle';
  const warnings: string[] = [];
  if (!disabled && (pool.acquired > 0 || pool.queued > 0)) {
    if (pool.tripped) warnings.push('Circuit breaker active');
    if (pool.state === 'auth_failed') warnings.push('Authentication failed');
    else if (pool.state === 'offline') warnings.push('Connection attempts failing');
    if (pool.throttled) warnings.push('Provider throttled');
    // Capacity only warrants attention when a fetch is actually waiting.
    if (pool.available <= 0 && pool.queued > 0) warnings.push('No available connections · fetches queued');
    if (stats && stats.articles + stats.missing + stats.errors >= 20) {
      if (stats.missRate >= .1) warnings.push('Missing articles ≥10%');
      if (stats.errorRate >= .05) warnings.push('Errors ≥5%');
    }
  }
  return { state, label: state.charAt(0).toUpperCase() + state.slice(1), warnings };
}
