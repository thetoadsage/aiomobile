import { validMonitoring, prepareMonitoring } from './monitoring';
import { diagnose, diagnosticSource } from '../lib/diagnostics';
import { validLogSnapshot } from '../lib/logs';
import { validUsage } from './usage';
import type { BandwidthOverview, LiveStats, LiveStreams, StreamHistoryRow, UsenetStatsOverview } from './types';
export class ApiError extends Error { constructor(message: string, public status = 0) { super(message); } }
export function endpoint(base: string, path: string) { return `${base}/api/v1/dashboard${path}`; }
export async function request<T>(base: string, path: string, signal?: AbortSignal, method = 'GET', body?: unknown): Promise<T> {
  try { return await fetchDashboard<T>(base,path,signal,method,body); }
  catch(error) {
    if(!signal?.aborted) {
      const status=error instanceof ApiError ? error.status : 0;
      diagnose([401,403].includes(status) ? 'Authentication failure' : 'API response failure',diagnosticSource(path),status);
    }
    throw error;
  }
}
async function fetchDashboard<T>(base: string, path: string, signal?: AbortSignal, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(endpoint(base, path), { method, credentials: 'include', cache: 'no-store', headers: { Accept: 'application/json', ...(body===undefined ? {} : {'Content-Type':'application/json'}) }, ...(body===undefined ? {} : {body:JSON.stringify(body)}), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(navigator.onLine ? 'Cannot reach AIOStreams. Check the instance URL, reverse proxy, and CORS configuration.' : 'You’re offline. Reconnect to update monitoring data.');
  }
  if (response.status === 401) throw new ApiError('Sign in to AIOStreams to continue.', 401);
  if (response.status === 403) throw new ApiError('An AIOStreams admin account is required.', 403);
  if(response.redirected && new URL(response.url).pathname==='/login') throw new ApiError('Sign in to AIOStreams to continue.',401);
  const json = await response.json().catch(() => { throw new ApiError('AIOStreams returned an unexpected response. Check the API route and proxy configuration.', response.status); });
  if(!record(json)) throw new ApiError('AIOStreams returned an unexpected response.',response.status);
  if (!response.ok || json.success !== true) throw new ApiError((record(json.error) && typeof json.error.message==='string' ? json.error.message : undefined) ?? `Request failed (${response.status})`, response.status);
  if (method === 'GET' && !validSnapshot(path, json.data)) throw new ApiError('This instance returned an incompatible dashboard response. See the supported API contract.');
  return prepareMonitoring(path, json.data) as T;
}
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const numbers = (value: unknown, keys: string[]) => record(value) && keys.every(key => typeof value[key] === 'number' && Number.isFinite(value[key]));
export function validSnapshot(path: string, data: unknown): boolean {
  const monitoring = validMonitoring(path, data);
  if (monitoring !== undefined) return monitoring;
  if(path.startsWith('/logs')) return validLogSnapshot(data);
  if (!record(data)) return false;
  const usage = validUsage(path, data);
  if (usage === false) return false;
  if (usage === true && !path.startsWith('/usenet/stats')) return true;
  if (path.startsWith('/streams/live')) return Array.isArray(data.streams) && data.streams.every(s => record(s) && typeof s.id === 'string' && typeof s.username === 'string' && ['usenet','proxy'].includes(String(s.transport)) && ['streaming','paused','idle'].includes(String(s.activity)) && numbers(s, ['size','bytesServed','bytesPerSec','startedAt','activeReads','idleMs','start','currentBytes']) && Number.isSafeInteger(s.activeReads) && Number(s.activeReads) >= 0) && numbers(data.summary, ['streaming','paused','idle','totalBytesPerSec','connectionLimit']) && ['streaming','paused','idle','connectionLimit'].every(key => record(data.summary) && Number.isSafeInteger(data.summary[key]) && Number(data.summary[key]) >= 0);
  if (path.startsWith('/usenet/live')) return numbers(data.live, ['activeStreams','currentBytesPerSec','peakBytesPerSec','articlesLastMinute','errorsLastMinute','bytesLastMinute']) && record(data.pool) && Array.isArray(data.pool.providers) && data.pool.providers.every(p => record(p) && typeof p.id === 'string' && ['online','connecting','offline','auth_failed','disabled'].includes(String(p.state)) && typeof p.tripped==='boolean' && typeof p.throttled==='boolean' && numbers(p, ['acquired','max','throughput','idle','available','queued']));
  if (path.startsWith('/usenet/stats')) return Array.isArray(data.providers) && data.providers.every(p=>record(p) && typeof p.id==='string' && typeof p.host==='string' && record(p.live) && typeof p.enabled==='boolean' && numbers(p,['articles','bytes','errors','missing','undecodable','avgArticleMs','avgBytesPerSec','errorRate','missRate','articleShare']) && (p.avgLatencyMs===null || typeof p.avgLatencyMs==='number')) && Array.isArray(data.indexers) && data.indexers.every(i=>record(i) && typeof i.indexer==='string' && numbers(i,['grabs','ok','degraded','failed','failedMissing','failedFetch','fetchAuth','fetchLimited','successRate','grabShare']) && (i.avgGrabMs===null || typeof i.avgGrabMs==='number') && (i.avgImportMs===null || typeof i.avgImportMs==='number') && (!i.lastError || record(i.lastError) && typeof i.lastError.message==='string' && numbers(i.lastError,['atMs']))) && Array.isArray(data.throughput);
  return true;
}
export type { BandwidthOverview, LiveStats, LiveStreams, StreamHistoryRow, UsenetStatsOverview };
