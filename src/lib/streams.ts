import type { LiveStreamSession } from '../api/types';
import { progress } from './format';
/** Position of the newest range read, not cumulative transfer or playback time. */
export function filePosition(stream: LiveStreamSession) {
  if (stream.activeReads <= 0 || !Number.isFinite(stream.start) || stream.start < 0 || !Number.isFinite(stream.currentBytes) || stream.currentBytes < 0 || !Number.isFinite(stream.size)) return undefined;
  return progress(stream.start + stream.currentBytes, stream.size);
}
export type StreamSort = 'recent' | 'throughput' | 'oldest';
export function selectStreams(streams: LiveStreamSession[], query: string, transport: string, sort: StreamSort) {
  const needle = query.trim().toLocaleLowerCase();
  return streams.filter(stream => (transport === 'all' || stream.transport === transport) && (!needle || `${stream.filename ?? ''}\n${stream.username}`.toLocaleLowerCase().includes(needle)))
    .sort((a, b) => (sort === 'throughput' ? b.bytesPerSec - a.bytesPerSec || b.startedAt - a.startedAt : sort === 'oldest' ? a.startedAt - b.startedAt : b.startedAt - a.startedAt) || a.id.localeCompare(b.id));
}
