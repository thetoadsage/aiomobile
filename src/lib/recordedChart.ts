export interface RecordedPoint { at: number; value: number }
export interface RecordedBucket extends RecordedPoint { total: number; end: number }

/** Accumulate only returned buckets; an absent bucket is not a measured zero. */
export function recordedSeries(points: RecordedPoint[], bucketMs: number, from: number, to: number) {
  const interval = Number.isFinite(bucketMs) && bucketMs > 0 ? bucketMs : 3600000;
  const end = Number.isFinite(to) ? to : 0;
  const start = Math.min(end, Math.floor((Number.isFinite(from) ? from : end - interval) / interval) * interval);
  const merged = new Map<number, number>();
  for (const point of points) {
    if (!Number.isFinite(point.at) || !Number.isFinite(point.value) || point.value < 0 || point.at > end) continue;
    const at = Math.floor(point.at / interval) * interval;
    if (at + interval <= start) continue;
    merged.set(at, (merged.get(at) ?? 0) + point.value);
  }
  let total = 0;
  const buckets: RecordedBucket[] = [...merged].sort(([a], [b]) => a - b).map(([at, value]) => ({ at, value, total: total += value, end: Math.min(end, at + interval) }));
  const slots = Math.max(1, Math.ceil((end - start) / interval), buckets.length ? Math.floor((buckets.at(-1)!.at - start) / interval) + 1 : 0);
  return { start, end, interval, buckets, total, slots };
}

export function recordedSelection(series: ReturnType<typeof recordedSeries>, index: number) {
  const at = series.start + Math.max(0, Math.min(series.slots - 1, index)) * series.interval;
  const bucket = series.buckets.find(point => point.at === at);
  let total = 0;
  for (const point of series.buckets) {
    if (point.at > at) break;
    total = point.total;
  }
  return { at, end: Math.min(series.end, at + series.interval), value: bucket?.value, total };
}
