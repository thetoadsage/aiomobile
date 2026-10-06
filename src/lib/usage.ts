import type { BandwidthOverview, StreamHistoryRow, UsenetWindow } from '../api/types';
export const usenetWindowLabel = (window: UsenetWindow) => window === 'all' ? 'All retained history' : window === '24h' ? 'Last 24 hours' : window === '7d' ? 'Last 7 days' : 'Last 30 days';
export const periodLabel = (data?: BandwidthOverview) => data?.periodMode === 'monthly' ? 'Monthly accounting period' : 'Rolling 30-day period';
export function usageRatio(used: number, limit: number) {
  return Number.isFinite(used) && used >= 0 && Number.isFinite(limit) && limit > 0 ? used / limit : undefined;
}
export function historyDuration(row: StreamHistoryRow) {
  const end = row.endedAt ?? row.lastSeenAt;
  return Number.isFinite(end) && end >= row.startedAt ? end - row.startedAt : undefined;
}
