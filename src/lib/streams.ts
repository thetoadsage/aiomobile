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

/** Display threshold only; cumulative delivery, independent of rate or position. */
export const MIN_TRANSFER_BYTES = 64 * 1024;
export function visibleTransfers<T extends { bytesServed: number }>(streams: T[], showAll = false): T[] {
  return showAll ? streams : streams.filter(stream => stream.bytesServed >= MIN_TRANSFER_BYTES);
}

export interface ObservedFilePosition { startedAt: number; percent: number }
export type FilePositions = ReadonlyMap<string, ObservedFilePosition>;
/** Retain only the current sessions, advancing valid observations monotonically. */
export function retainFilePositions(previous: FilePositions, streams: LiveStreamSession[]): FilePositions {
  const next = new Map<string, ObservedFilePosition>();
  for (const stream of streams) {
    const known = previous.get(stream.id);
    const held = known?.startedAt === stream.startedAt ? known.percent : undefined;
    const observed = filePosition(stream);
    const percent = observed === undefined ? held : held === undefined ? observed : Math.max(held, observed);
    if (percent !== undefined) next.set(stream.id, { startedAt: stream.startedAt, percent });
  }
  return next;
}
