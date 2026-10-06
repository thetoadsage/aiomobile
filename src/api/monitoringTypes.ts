// Read-only projections of AIOStreams dashboard types (AGPL-3.0-only).
// System/tasks/library: 70ffb17a; Media Info: 147773cb. See docs/api-contract.md.
export interface SystemMetrics {
  ts: number;
  cpu: { total: number; process: number; cores: number; model: string };
  memory: { total: number; used: number; free: number; heapUsed: number; heapTotal: number; external: number; rss: number };
  disk: { path: string; total: number; used: number; free: number } | null;
  process: { uptimeSec: number; nodeVersion: string; platform: string };
}
export interface TaskState {
  id: string; label: string; description: string; category: string; enabled: boolean; running: boolean;
  lastRunAt: number | null; lastDurationMs: number | null; lastStatus: 'ok' | 'error' | 'skipped' | null;
  lastError: string | null; nextRunAt: number | null;
}
export interface TasksSnapshot { tasks: TaskState[]; instanceId: string }
export type LibraryStatus = 'queued' | 'inspecting' | 'available' | 'degraded' | 'failed' | 'streaming';
export interface LibraryFile { name?: string; size: number; path?: string; category?: string; streamable?: boolean }
export interface LibraryEntry {
  nzbHash: string; name?: string; size?: number; files: LibraryFile[]; status: LibraryStatus;
  failReason?: string; errorCode?: string; failCount: number; addedAt: string; lastUsedAt: string;
  owner?: string; origin: 'playback' | 'dashboard' | 'sabnzbd'; importMs?: number;
  lastCheckedAt?: number; nextCheckAt?: number | null; checkCount: number; blocked: boolean;
  probedFiles?: number; probeableFiles?: number;
}
export interface LibrarySnapshot { entries: LibraryEntry[]; total: number }
export type ProbeOutcome = 'stored' | 'applied' | 'empty' | 'failed' | 'timeout' | 'cancelled';
export interface MediaSummary {
  stored: { total: number; lastDay: number; byOrigin: { origin: string; files: number; lastDay: number }[] };
  day: Record<ProbeOutcome, number> & { attempts: number; medianMs: number | null; p95Ms: number | null };
  probing: boolean; ffprobe: { missing: boolean; version: string | null };
}
export interface ProbeJob {
  id: string; file: string; kind: 'usenet' | 'torrent'; path: string;
  stage: 'waiting' | 'queued' | 'opening' | 'probing'; queuedAt: number; startedAt?: number; bytesRead: number;
}
export interface MediaLive {
  enabled: boolean; jobs: ProbeJob[]; limits: { concurrency: number; queue: number; timeoutSeconds: number };
  ffprobe: { missing: boolean };
}
export interface ProbeAttempt {
  id: string; file: string; kind: 'usenet' | 'torrent'; path: string; outcome: ProbeOutcome;
  error: string | null; finishedAt: number; startedAt: number | null; queuedAt: number; bytesRead: number; tracks: number | null;
}
export interface MediaTrack {
  index: number; type: 'video' | 'audio' | 'subtitle'; codec?: string; language?: string; title?: string;
  width?: number; height?: number; channels?: number; default?: boolean; forced?: boolean; hearingImpaired?: boolean;
}
export interface MediaFile {
  file: string; title?: string | null; nzbName: string | null; origin: string; updatedAt: number; size: number | null;
  info: { container?: string; duration?: number; bitrate?: number; chapters: boolean; tracks: MediaTrack[] };
}
export interface MediaPage<T> { items: T[]; total: number; capped: boolean }
