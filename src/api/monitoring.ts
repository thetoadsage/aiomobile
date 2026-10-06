import { maskLogText } from '../lib/logs';
const obj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const nums = (v: unknown, keys: string[]) => obj(v) && keys.every(k => num(v[k]));
const strings = (v: unknown, keys: string[]) => obj(v) && keys.every(k => typeof v[k] === 'string');
const optionalText = (v: unknown) => v === undefined || v === null || typeof v === 'string';
const optionalNum = (v: unknown) => v === undefined || num(v);
const nullableNum = (v: unknown) => v === null || num(v);
const list = (v: unknown, valid: (row: Record<string, unknown>) => boolean) => Array.isArray(v) && v.every(row => obj(row) && valid(row));
const outcomes = ['stored','applied','empty','failed','timeout','cancelled'];
const track = (r: Record<string, unknown>) => num(r.index) && ['video','audio','subtitle'].includes(String(r.type)) && ['codec','language','title'].every(k => optionalText(r[k])) && ['width','height','channels'].every(k => optionalNum(r[k])) && ['default','forced','hearingImpaired'].every(k => r[k] === undefined || typeof r[k] === 'boolean');
export function validMonitoring(path: string, v: unknown): boolean | undefined {
  const name = path.split('?')[0];
  if (!['/system','/tasks','/usenet/library','/media-info','/media-info/live','/media-info/probes','/media-info/files'].includes(name)) return undefined;
  if (!obj(v)) return false;
  if (name === '/system') return num(v.ts) && nums(v.cpu,['total','process','cores']) && strings(v.cpu,['model']) && nums(v.memory,['total','used','free','heapUsed','heapTotal','external','rss']) && (v.disk === null || nums(v.disk,['total','used','free']) && strings(v.disk,['path'])) && nums(v.process,['uptimeSec']) && strings(v.process,['nodeVersion','platform']);
  if (name === '/tasks') return typeof v.instanceId === 'string' && list(v.tasks,r => strings(r,['id','label','description','category']) && typeof r.enabled === 'boolean' && typeof r.running === 'boolean' && ['ok','error','skipped',null].includes(r.lastStatus as string | null) && ['lastRunAt','lastDurationMs','nextRunAt'].every(k => nullableNum(r[k])) && (r.lastError === null || typeof r.lastError === 'string'));
  if (name === '/usenet/library') return num(v.total) && list(v.entries,r => strings(r,['nzbHash','addedAt','lastUsedAt']) && ['queued','inspecting','available','degraded','failed','streaming'].includes(String(r.status)) && ['playback','dashboard','sabnzbd'].includes(String(r.origin)) && nums(r,['failCount','checkCount']) && typeof r.blocked === 'boolean' && ['name','owner','failReason','errorCode'].every(k => optionalText(r[k])) && ['size','importMs','lastCheckedAt','probedFiles','probeableFiles'].every(k => optionalNum(r[k])) && (r.nextCheckAt === null || optionalNum(r.nextCheckAt)) && list(r.files,f => num(f.size) && ['name','path','category'].every(k => optionalText(f[k])) && (f.streamable === undefined || typeof f.streamable === 'boolean')));
  if (name === '/media-info') return nums(v.stored,['total','lastDay']) && obj(v.stored) && list(v.stored.byOrigin,r => strings(r,['origin']) && nums(r,['files','lastDay'])) && nums(v.day,['attempts',...outcomes]) && obj(v.day) && nullableNum(v.day.medianMs) && nullableNum(v.day.p95Ms) && typeof v.probing === 'boolean' && obj(v.ffprobe) && typeof v.ffprobe.missing === 'boolean' && (v.ffprobe.version === null || typeof v.ffprobe.version === 'string');
  if (name === '/media-info/live') return typeof v.enabled === 'boolean' && nums(v.limits,['concurrency','queue','timeoutSeconds']) && obj(v.ffprobe) && typeof v.ffprobe.missing === 'boolean' && list(v.jobs,r => strings(r,['id','file','path']) && ['usenet','torrent'].includes(String(r.kind)) && ['waiting','queued','opening','probing'].includes(String(r.stage)) && nums(r,['queuedAt','bytesRead']) && optionalNum(r.startedAt));
  if (!num(v.total) || typeof v.capped !== 'boolean') return false;
  if (name === '/media-info/probes') return list(v.items,r => strings(r,['id','file','path']) && ['usenet','torrent'].includes(String(r.kind)) && outcomes.includes(String(r.outcome)) && nums(r,['queuedAt','finishedAt','bytesRead']) && nullableNum(r.startedAt) && nullableNum(r.tracks) && (r.error === null || typeof r.error === 'string'));
  return list(v.items,r => strings(r,['file','origin']) && optionalText(r.title) && (r.nzbName === null || typeof r.nzbName === 'string') && num(r.updatedAt) && nullableNum(r.size) && obj(r.info) && typeof r.info.chapters === 'boolean' && ['container'].every(k => optionalText(r.info && (r.info as Record<string, unknown>)[k])) && ['duration','bitrate'].every(k => optionalNum(r.info && (r.info as Record<string, unknown>)[k])) && list(r.info.tracks,track));
}
// Keep only the read-only fields this app renders. Drop library passwords,
// credential-bearing NZB URLs, archive recipes, release keys and unknown metadata.
function pick(r: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys.filter(k => r[k] !== undefined).map(k => [k, typeof r[k] === 'string' ? maskLogText(r[k] as string) : r[k]]));
}
export function prepareMonitoring(path: string, data: unknown): unknown {
  if (!obj(data)) return data;
  const name = path.split('?')[0];
  if (name === '/analytics/addons') return {total:data.total,customEndpoints:data.customEndpoints,addons:(data.addons as Record<string, unknown>[]).map(r => ({...pick(r,['presetId','requests','share','errors','errorRate','avgLatencyMs']),errorKinds:Object.fromEntries(Object.entries(r.errorKinds as Record<string, number>).map(([kind,count]) => [maskLogText(kind),count]))}))};
  if (name === '/usenet/library') return { total:data.total, entries:(data.entries as Record<string, unknown>[]).map(r => ({...pick(r,['nzbHash','name','size','status','failReason','errorCode','failCount','addedAt','lastUsedAt','owner','origin','importMs','lastCheckedAt','nextCheckAt','checkCount','blocked','probedFiles','probeableFiles']),files:(r.files as Record<string, unknown>[]).map(f => pick(f,['name','size','path','category','streamable']))})) };
  if (name === '/system') return {ts:data.ts,cpu:pick(data.cpu as Record<string, unknown>,['total','process','cores','model']),memory:pick(data.memory as Record<string, unknown>,['total','used','free','heapUsed','heapTotal','external','rss']),disk:data.disk,process:pick(data.process as Record<string, unknown>,['uptimeSec','nodeVersion','platform'])};
  if (name === '/media-info') return {stored:data.stored,day:pick(data.day as Record<string, unknown>,['attempts','medianMs','p95Ms',...outcomes]),probing:data.probing,ffprobe:pick(data.ffprobe as Record<string, unknown>,['missing','version'])};
  if (name === '/tasks') return {instanceId:data.instanceId,tasks:(data.tasks as Record<string, unknown>[]).map(r => pick(r,['id','label','description','category','enabled','running','lastRunAt','lastDurationMs','lastStatus','lastError','nextRunAt']))};
  if (name === '/media-info/live') return {...pick(data,['enabled','limits','ffprobe']),jobs:(data.jobs as Record<string, unknown>[]).map(r => pick(r,['id','file','kind','path','stage','queuedAt','startedAt','bytesRead']))};
  if (name === '/media-info/probes') return {...pick(data,['total','capped']),items:(data.items as Record<string, unknown>[]).map(r => pick(r,['id','file','kind','path','outcome','error','finishedAt','startedAt','queuedAt','bytesRead','tracks']))};
  if (name === '/media-info/files') return {...pick(data,['total','capped']),items:(data.items as Record<string, unknown>[]).map(r => ({...pick(r,['file','title','nzbName','origin','updatedAt','size']),info:{...pick(r.info as Record<string, unknown>,['container','duration','bitrate','chapters']),tracks:((r.info as Record<string, unknown>).tracks as Record<string, unknown>[]).map(t => pick(t,['index','type','codec','language','title','width','height','channels','default','forced','hearingImpaired']))}}))};
  return data;
}
