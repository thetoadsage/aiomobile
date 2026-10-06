// Type declarations vendored from AIOStreams (AGPL-3.0-only).
// Source commit: 70ffb17a7bb99dd73dbab257af040b04f56eaa42
// See docs/api-contract.md and NOTICE. Keep synchronized with upstream.

export type StreamTransport = 'usenet' | 'proxy';

export type StreamEndReason =
  | 'idle'
  | 'stopped'
  | 'banned'
  | 'limit'
  | 'error'
  | 'stale';

/**
 * What a session is doing. `paused` and `idle` both mean no bytes are moving,
 * split by whether the client still holds its request open.
 */
export type StreamActivity = 'streaming' | 'paused' | 'idle';

/** One in-flight watch: every range read of a playback folded into one row. */
export interface LiveStreamSession {
  id: string;
  transport: StreamTransport;
  username: string;
  clientIp?: string;
  targetKey: string;
  filename?: string;
  displayUrl?: string;
  size: number;
  bytesServed: number;
  requests: number;
  startedAt: number;
  lastSeenAt: number;
  /** Open reads. A paused player still holds one. */
  activeReads: number;
  activity: StreamActivity;
  /** Time since the last byte reached the client. */
  idleMs: number;
  /** Byte offset of the newest read. */
  start: number;
  /** Bytes served by the newest read, excluding its starting offset. */
  currentBytes: number;
  bytesPerSec: number;
  instanceId: string;
}

export interface LiveStreams {
  streams: LiveStreamSession[];
  summary: {
    streaming: number;
    paused: number;
    idle: number;
    totalBytesPerSec: number;
    /** Instance-wide concurrent-stream cap; 0 when unlimited. */
    connectionLimit: number;
  };
  /** The server's sampling interval; present only on streamed frames. */
  tickMs?: number;
}

export interface StreamHistoryRow {
  id: string;
  transport: StreamTransport;
  username: string;
  clientIp?: string;
  targetKey: string;
  filename?: string;
  displayUrl?: string;
  size: number;
  bytesServed: number;
  requests: number;
  startedAt: number;
  lastSeenAt: number;
  endedAt?: number;
  endReason?: StreamEndReason;
  instanceId: string;
}

/**
 * `24h` and `7d` are plain rolling windows; `30d` is the accounting period:
 * the last 30 days, or month-to-date when the period mode is monthly.
 */
export type BandwidthWindow = '24h' | '7d' | '30d';

export interface BandwidthOverview {
  window: BandwidthWindow;
  generatedAt: number;
  sinceMs: number;
  bucketMs: number;
  periodStart: number;
  periodMode: 'rolling' | 'monthly';
  total: number;
  byTransport: Record<StreamTransport, number>;
  byUser: Array<{
    username: string;
    bytes: number;
    limit: number;
    connectionLimit: number;
  }>;
  series: Array<{ bucketMs: number; bytes: number }>;
  seriesByUser: Array<{
    username: string;
    aggregated?: boolean;
    series: Array<{ bucketMs: number; bytes: number }>;
  }>;
  globalLimit: number;
  periodTotal: number;
}

export type UsenetWindow = '24h' | '7d' | '30d' | 'all';

/** Sentinel sent back in place of an unchanged provider password. */
export const PROVIDER_SECRET_MASK = '__stored__';

export type ProviderState =
  | 'online'
  | 'connecting'
  | 'offline'
  | 'auth_failed'
  | 'disabled';

export interface LiveTiles {
  activeStreams: number;
  currentBytesPerSec: number;
  peakBytesPerSec: number;
  articlesLastMinute: number;
  errorsLastMinute: number;
  bytesLastMinute: number;
}

export interface ProviderPoolInfo {
  id: string;
  name?: string;
  state: ProviderState;
  total: number;
  idle: number;
  acquired: number;
  available: number;
  max: number;
  tripped: boolean;
  throttled: boolean;
  isBackup: boolean;
  freeSlots: number;
  throughput: number;
  /** Requests waiting in the pool's queues (not yet on a connection). */
  queued: number;
  /** Epoch ms of the last successful dial; undefined if never dialed. */
  lastDialOkAt?: number;
  /** Most recent failed dial attempt (not cleared by later successes). */
  lastDialError?: { at: number; kind: string; message: string };
}

export interface PoolInfo {
  providers: ProviderPoolInfo[];
  globalDownloadsInUse: number;
  globalDownloadMax: number;
  /** In-use permits whose transfer has actually started on a connection. */
  globalDownloadsOnWire: number;
  /** Fetches still waiting for a semaphore permit (e.g. prefetch bursts). */
  globalDownloadsWaiting: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  diskBytes: number;
  diskCount: number;
  diskHits: number;
}

export interface ProviderLiveInfo {
  state: ProviderState;
  active: number;
  idle: number;
  total: number;
  max: number;
  available: number;
  tripped: boolean;
}

export interface UsenetProviderStatRow {
  id: string;
  name?: string;
  host: string;
  enabled: boolean;
  isBackup: boolean;
  priority: number;
  live: ProviderLiveInfo;
  articles: number;
  bytes: number;
  errors: number;
  missing: number;
  undecodable: number;
  avgLatencyMs: number | null;
  avgArticleMs: number;
  avgBytesPerSec: number;
  errorRate: number;
  missRate: number;
  undecodableRate: number;
  articleShare: number;
  removed: boolean;
}

export interface UsenetThroughputPoint {
  bucketMs: number;
  articles: number;
  bytes: number;
  errors: number;
  missing: number;
  undecodable: number;
  avgLatencyMs: number | null;
  avgBytesPerSec: number;
}

/** Per-indexer grab aggregates over the window (import-time outcomes only). */
export interface UsenetIndexerStatRow {
  indexer: string;
  grabs: number;
  ok: number;
  degraded: number;
  failed: number;
  failedMissing: number;
  failedFetch: number;
  fetchAuth: number;
  fetchLimited: number;
  successRate: number;
  grabShare: number;
  avgGrabMs: number | null;
  avgImportMs: number | null;
  lastError?: { status?: number; message: string; atMs: number };
}

export interface UsenetStatsOverview {
  window: UsenetWindow;
  generatedAt: number;
  bucketMs: number;
  live: LiveTiles;
  pool: PoolInfo;
  cache: CacheStats;
  totals: {
    articles: number;
    bytes: number;
    errors: number;
    missing: number;
    undecodable: number;
    avgLatencyMs: number | null;
    avgArticleMs: number;
    avgBytesPerSec: number;
  };
  providers: UsenetProviderStatRow[];
  indexers: UsenetIndexerStatRow[];
  throughput: UsenetThroughputPoint[];
  firstSeenAt?: number;
}

/** One in-flight read stream for the live "Streams" view. */
export interface LiveStreamInfo {
  id: string;
  nzbHash: string;
  filename?: string;
  size: number;
  start: number;
  bytesServed: number;
  bytesPerSec: number;
  openedAt: number;
}

export interface LiveStats {
  live: LiveTiles;
  pool: PoolInfo;
  cache: CacheStats;
  streams: LiveStreamInfo[];
  /**
   * The server's sampling interval, present only on streamed frames.
   */
  tickMs?: number;
}
