// LogRecord and LogQuery vendored verbatim from AIOStreams (AGPL-3.0-only).
// packages/core/src/logging/ring-buffer.ts @ 70ffb17a7bb99dd73dbab257af040b04f56eaa42
export interface LogRecord {
  seq: number;
  ts: number;
  level: string;
  module?: string;
  line: string;
}
export interface LogQuery {
  q?: string;
  regex?: boolean;
  levels?: string[];
  modules?: string[];
  since?: number;
  until?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}
// Response inferred from the dashboard /logs route and ring-buffer.stats().
export interface LogSnapshot {
  logs: LogRecord[];
  nextSeq: number;
  bufferStats: { entries: number; bytes: number; maxBytes: number; maxEntries: number; lastSeq: number };
}
