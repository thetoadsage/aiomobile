import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadFilteredHistory } from '../src/api/streamHistory';
import { MIN_TRANSFER_BYTES, visibleTransfers } from '../src/lib/streams';
import { loadSettings } from '../src/lib/settings';
import { history } from './fixtures';

beforeEach(() => {
  vi.stubGlobal('document', { hidden: false });
  vi.stubGlobal('navigator', { onLine: true });
});
afterEach(() => vi.unstubAllGlobals());
const row = (id: number, bytesServed: number) => ({ ...history[0], id: `row-${id}`, filename: `Episode.${id}.mkv`, bytesServed });
function serve(rows: ReturnType<typeof row>[]) {
  const fetcher = vi.fn(async (input: string) => {
    const url = new URL(input, 'https://fixture.test');
    expect(url.searchParams.has('_cursor')).toBe(false);
    expect(url.searchParams.has('_sort')).toBe(false);
    const offset = Number(url.searchParams.get('offset'));
    const limit = Number(url.searchParams.get('limit'));
    return new Response(JSON.stringify({ success: true, data: { entries: rows.slice(offset, offset + limit), total: rows.length } }));
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

describe('tiny transfer visibility', () => {
  it('uses cumulative bytes with an inclusive 64 KiB boundary and Show all override', () => {
    const rows = [0, 4096, MIN_TRANSFER_BYTES - 1, MIN_TRANSFER_BYTES, MIN_TRANSFER_BYTES + 1].map((bytesServed, i) => row(i, bytesServed));
    expect(visibleTransfers(rows).map(r => r.bytesServed)).toEqual([MIN_TRANSFER_BYTES, MIN_TRANSFER_BYTES + 1]);
    expect(visibleTransfers(rows, true)).toEqual(rows);
  });
  it('defaults old preferences to filtering and restores only an explicit Show all boolean', () => {
    for (const value of [undefined, false, 'true', true]) {
      vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ showAllTransfers: value }) });
      expect(loadSettings().showAllTransfers).toBe(value === true);
    }
  });
  it('fills filtered pages across tiny records and keeps subsequent cursors lossless', async () => {
    serve(Array.from({ length: 165 }, (_, i) => row(i, i < 120 ? 4096 : MIN_TRANSFER_BYTES)));
    const first = await loadFilteredHistory('', '/streams/history?q=Episode&_cursor=0&_sort=recent');
    expect(first.entries.map(r => r.id)).toEqual(Array.from({ length: 20 }, (_, i) => `row-${120 + i}`));
    expect(first).toMatchObject({ nextCursor: 140, hidden: 120, scanned: 140, hasMore: true });
    const second = await loadFilteredHistory('', '/streams/history?_cursor=140&_sort=recent');
    expect(second.entries[0].id).toBe('row-140');
    const third = await loadFilteredHistory('', '/streams/history?_cursor=160&_sort=recent');
    expect(third).toMatchObject({ nextCursor: 165, hasMore: false });
    expect(third.entries).toHaveLength(5);
  });
  it('scans from the tail for oldest ordering', async () => {
    serve(Array.from({ length: 165 }, (_, i) => row(i, i >= 45 ? 4096 : MIN_TRANSFER_BYTES)));
    const first = await loadFilteredHistory('', '/streams/history?_cursor=0&_sort=oldest');
    expect(first.entries.map(r => r.id)).toEqual(Array.from({ length: 20 }, (_, i) => `row-${44 - i}`));
    const second = await loadFilteredHistory('', '/streams/history?_cursor=140&_sort=oldest');
    expect(second.entries[0].id).toBe('row-24');
  });
  it('bounds long runs of probes and exposes continuation instead of claiming no history', async () => {
    const fetcher = serve(Array.from({ length: 601 }, (_, i) => row(i, 4096)));
    expect(await loadFilteredHistory('', '/streams/history')).toMatchObject({ entries: [], nextCursor: 500, hasMore: true, scanned: 500, hidden: 500 });
    expect(fetcher).toHaveBeenCalledTimes(5);
  });
  it('stops scanning immediately on authentication failure, backgrounding or cancellation', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(loadFilteredHistory('', '/streams/history')).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    vi.stubGlobal('document', { hidden: true });
    await expect(loadFilteredHistory('', '/streams/history')).rejects.toMatchObject({ name: 'AbortError' });
    const controller = new AbortController(); controller.abort();
    await expect(loadFilteredHistory('', '/streams/history', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
