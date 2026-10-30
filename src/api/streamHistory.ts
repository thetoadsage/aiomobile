import { request } from './client';
import type { StreamHistoryRow } from './types';
import { MIN_TRANSFER_BYTES } from '../lib/streams';

export interface FilteredHistoryPage {
  entries: StreamHistoryRow[];
  nextCursor: number;
  hasMore: boolean;
  hidden: number;
  scanned: number;
}
type HistorySnapshot = { entries: StreamHistoryRow[]; total: number };

/** Scan a bounded slice; never treat the server's unfiltered total as a match count. */
export async function loadFilteredHistory(base: string, path: string, signal?: AbortSignal): Promise<FilteredHistoryPage> {
  const query = new URLSearchParams(path.split('?')[1]);
  const oldest = query.get('_sort') === 'oldest';
  let cursor = Number(query.get('_cursor') || 0);
  query.delete('_sort'); query.delete('_cursor');
  const read = (offset: number, limit: number) => {
    signal?.throwIfAborted();
    if (document.hidden || !navigator.onLine) throw new DOMException('History scan suspended', 'AbortError');
    const params = new URLSearchParams(query);
    params.set('offset', String(offset)); params.set('limit', String(limit));
    return request<HistorySnapshot>(base, `/streams/history?${params}`, signal);
  };
  let total = oldest ? (await read(0, 1)).total : Infinity;
  const result: FilteredHistoryPage = { entries: [], nextCursor: cursor, hasMore: false, hidden: 0, scanned: 0 };
  const seen = new Set<string>();
  for (let batch = 0; batch < 5 && cursor < total && result.entries.length < 20; batch++) {
    const limit = oldest ? Math.min(100, total - cursor) : 100;
    const snapshot = await read(oldest ? Math.max(0, total - cursor - limit) : cursor, limit);
    total = snapshot.total;
    const entries = oldest ? snapshot.entries.slice().reverse() : snapshot.entries;
    if (!entries.length) { cursor = total; break; }
    for (const entry of entries) {
      cursor++; result.scanned++;
      if (entry.bytesServed < MIN_TRANSFER_BYTES) result.hidden++;
      else if (!seen.has(entry.id)) { result.entries.push(entry); seen.add(entry.id); }
      if (result.entries.length === 20) break;
    }
  }
  return { ...result, nextCursor: cursor, hasMore: cursor < total };
}
