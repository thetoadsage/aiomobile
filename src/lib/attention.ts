import type { ProviderPoolInfo, UsenetStatsOverview } from '../api/types';
import { providerHealth } from './health';
export interface AttentionItem { id: string; title: string; details: string; href: string }
export function collectAttention(providers: ProviderPoolInfo[], stats?: UsenetStatsOverview): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const provider of providers) {
    const stat = stats?.providers.find(row => row.id === provider.id);
    const warnings = providerHealth(provider, stat).warnings;
    if (warnings.length) items.push({ id: `provider:${provider.id}`, title: provider.name || stat?.name || provider.id, details: warnings.join(' · '), href: `#provider/${encodeURIComponent(provider.id)}` });
  }
  for (const indexer of stats?.indexers ?? []) {
    const problems: string[] = [];
    if (indexer.failed > 0) problems.push(`${indexer.failed.toLocaleString()} failed import${indexer.failed === 1 ? '' : 's'}`);
    if (indexer.fetchAuth > 0) problems.push(`${indexer.fetchAuth.toLocaleString()} auth failure${indexer.fetchAuth === 1 ? '' : 's'}`);
    if (indexer.fetchLimited > 0) problems.push(`${indexer.fetchLimited.toLocaleString()} rate limited`);
    if (problems.length) items.push({ id: `indexer:${indexer.indexer}`, title: indexer.indexer, details: `${problems.join(' · ')} · last 24h`, href: `#indexers/${encodeURIComponent(indexer.indexer)}` });
  }
  return items;
}
