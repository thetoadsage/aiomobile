const obj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const integer = (v: unknown) => num(v) && Number.isSafeInteger(v);
const nums = (v: unknown, keys: string[]) => obj(v) && keys.every(k => num(v[k]));
const nullable = (v: unknown) => v === null || num(v);
const optionalNum = (v: unknown) => v === undefined || num(v);
const optionalText = (v: unknown) => v === undefined || typeof v === 'string';
const list = (v: unknown, valid: (row: Record<string, unknown>) => boolean) => Array.isArray(v) && v.every(row => obj(row) && valid(row));
const buckets = (v: unknown) => list(v, row => nums(row, ['bucketMs','bytes']));
const totals = (v: unknown) => nums(v, ['articles','bytes','errors','missing','undecodable','avgArticleMs','avgBytesPerSec']) && obj(v) && nullable(v.avgLatencyMs);
const percentage = (v: unknown) => num(v) && v <= 100;

/** Validate newly rendered fields before REST or SSE snapshots enter retention. */
export function validUsage(path: string, data: unknown): boolean | undefined {
  const name = path.split('?')[0];
  if (!['/streams/bandwidth','/streams/history','/usenet/stats','/analytics/addons'].includes(name)) return undefined;
  if (!obj(data)) return false;
  if (name === '/streams/bandwidth') return ['24h','7d','30d'].includes(String(data.window)) && ['rolling','monthly'].includes(String(data.periodMode)) && nums(data,['generatedAt','sinceMs','periodStart','total','globalLimit','periodTotal']) && num(data.bucketMs) && data.bucketMs > 0 && nums(data.byTransport,['usenet','proxy']) && buckets(data.series) && list(data.byUser, r => typeof r.username === 'string' && nums(r,['bytes','limit']) && integer(r.connectionLimit)) && list(data.seriesByUser, r => typeof r.username === 'string' && (r.aggregated === undefined || typeof r.aggregated === 'boolean') && buckets(r.series));
  if (name === '/streams/history') return integer(data.total) && list(data.entries, r => typeof r.id === 'string' && typeof r.username === 'string' && ['usenet','proxy'].includes(String(r.transport)) && nums(r,['startedAt','lastSeenAt','bytesServed','size']) && integer(r.requests) && optionalNum(r.endedAt) && optionalText(r.filename) && (r.endReason === undefined || ['idle','stopped','banned','limit','error','stale'].includes(String(r.endReason))));
  if (name === '/usenet/stats') return ['24h','7d','30d','all'].includes(String(data.window)) && num(data.generatedAt) && num(data.bucketMs) && data.bucketMs > 0 && optionalNum(data.firstSeenAt) && totals(data.totals) && list(data.throughput, r => nums(r,['bucketMs','articles','bytes','errors','missing','undecodable','avgBytesPerSec']) && nullable(r.avgLatencyMs)) && list(data.providers, r => typeof r.removed === 'boolean' && optionalText(r.name) && typeof r.isBackup === 'boolean' && obj(r.live) && nums(r.live,['active','idle','total','max','available']));
  return integer(data.total) && integer(data.customEndpoints) && list(data.addons, r => typeof r.presetId === 'string' && integer(r.requests) && integer(r.errors) && percentage(r.share) && percentage(r.errorRate) && nullable(r.avgLatencyMs) && obj(r.errorKinds) && Object.values(r.errorKinds).every(integer));
}
