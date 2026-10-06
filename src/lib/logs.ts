import type { LogQuery, LogRecord, LogSnapshot } from '../api/logTypes';
export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
export const LOG_CAP = 1000;
export interface LogEntry { seq: number; ts: number; level: string; module?: string; message: string; metadata: Record<string, unknown>; line: string }
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value);
export function validLogSnapshot(value: unknown): value is LogSnapshot {
  return object(value) && Array.isArray(value.logs) && value.logs.every(row => object(row) && Number.isSafeInteger(row.seq) && Number(row.seq)>0 && finite(row.ts) && typeof row.level === 'string' && typeof row.line === 'string' && (row.module===undefined || typeof row.module==='string')) && Number.isSafeInteger(value.nextSeq) && Number(value.nextSeq)>=0 && object(value.bufferStats) && ['entries','bytes','maxBytes','maxEntries','lastSeq'].every(k=>finite(value.bufferStats && (value.bufferStats as Record<string,unknown>)[k]));
}
export function logQuery(query: LogQuery): string {
  const params = new URLSearchParams();
  if (query.q?.trim()) { params.set('q',query.q.trim()); if(query.regex) params.set('regex','true'); }
  if(query.levels?.length) params.set('level',[...query.levels].sort().join(','));
  if(query.modules?.length) params.set('module',[...query.modules].sort().join(','));
  for(const key of ['since','until','limit'] as const) if(query[key]!==undefined) params.set(key,String(query[key]));
  if(query.order) params.set('order',query.order);
  return params.toString();
}
// URL masking adapted from AIOStreams logging/redact.ts (AGPL-3.0-only); see NOTICE.
// Additional client masking is always on, including when upstream sensitive logging is enabled.
const secretField = /(api[-_]?key|passkey|password|passwd|secret|token|credential|authorization|cookie|headers)/i;
export function maskLogText(text: string): string {
  return text.replace(/([?&#][^&\s'"=#]*(?:apikey|api_key|token|secret|password|passwd|passkey|code)[^&\s'"=#]*=)([^&\s'"#]+)/gi,'$1<redacted>')
    .replace(/(\/\/[^/@\s:]*:)([^/@\s]+)@/g,'$1<redacted>@')
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9+/._=-]+/gi,'$1 <redacted>')
    .replace(/\b(api[-_]?key|passkey|password|passwd|secret|token|credential|authorization|cookie)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,'$1=<redacted>');
}
function maskValue(value: unknown, depth=0): unknown {
  if(depth>20) return '[nested value omitted]';
  if(typeof value==='string') return maskLogText(value);
  if(Array.isArray(value)) return value.map(v=>maskValue(v,depth+1));
  if(object(value)) return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,secretField.test(key) ? '<redacted>' : maskValue(v,depth+1)]));
  return value;
}
export function safeLogLine(line: string): string {
  try { return JSON.stringify(maskValue(JSON.parse(line))); } catch { return maskLogText(line); }
}
export function parseLog(seq: number, line: string, record?: LogRecord): LogEntry | undefined {
  if(!Number.isSafeInteger(seq) || seq<=0) return;
  const safeLine = safeLogLine(line);
  let parsed: Record<string,unknown> = {};
  try { const value: unknown=JSON.parse(safeLine); if(object(value)) parsed=value; } catch { /* Preserve plain-text upstream records. */ }
  const { time, level, module, msg, ...metadata }=parsed;
  const ts=record?.ts ?? (typeof time==='number' ? time : typeof time==='string' ? Date.parse(time) : NaN);
  return {seq,ts,level:typeof level==='string' ? level : record?.level ?? 'info',module:typeof module==='string' ? module : record?.module,message:typeof msg==='string' ? msg : Object.keys(parsed).length ? '(structured log entry)' : safeLine,metadata,line:safeLine};
}
export function mergeLogs(previous: LogEntry[], incoming: LogEntry[], cap=LOG_CAP): LogEntry[] {
  const records=new Map(previous.map(row=>[row.seq,row]));
  for(const row of incoming) records.set(row.seq,row);
  return [...records.values()].sort((a,b)=>a.seq-b.seq).slice(-cap);
}
