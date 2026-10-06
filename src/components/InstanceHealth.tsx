import type { Resource } from '../hooks/useData';
import type { SystemMetrics, TasksSnapshot } from '../api/monitoringTypes';
import type { LogSnapshot } from '../api/logTypes';
import { parseLog, maskLogText } from '../lib/logs';
import { bytes, count, date, duration } from '../lib/format';
import { Section, Status, Facts, Empty } from './UI';
const cpu = (value?: number) => value === undefined ? '—' : `${value.toFixed(1)}%`;
export function SystemCard({ resource, loginUrl }: { resource: Resource<SystemMetrics>; loginUrl: string }) {
  const m=resource.data;
  return <Section title="System"><Status resource={resource} loginUrl={loginUrl}/>{m && <div className="card system-card"><div className="system-reading"><span>Process CPU</span><strong>{cpu(m.cpu.process)}</strong></div><div className="system-reading"><span>Process memory</span><strong>{bytes(m.memory.rss)}</strong></div><div className="system-reading"><span>Uptime</span><strong>{duration(m.process.uptimeSec*1000)}</strong></div><details className="secondary-facts"><summary>System details</summary><Facts items={[
    ['System CPU',cpu(m.cpu.total)],['System memory',`${bytes(m.memory.used)} / ${bytes(m.memory.total)}`],['Heap used',`${bytes(m.memory.heapUsed)} / ${bytes(m.memory.heapTotal)}`],['External memory',bytes(m.memory.external)],['Disk free',m.disk ? bytes(m.disk.free) : 'Unavailable'],['Disk capacity',m.disk ? bytes(m.disk.total) : 'Unavailable'],['CPU cores',count(m.cpu.cores)],['Node',m.process.nodeVersion],
  ]}/><p className="caption">System readings describe the environment reported by AIOStreams. Process readings describe AIOStreams itself.</p></details></div>}</Section>;
}
export function TaskResults({ resource, loginUrl }: { resource: Resource<TasksSnapshot>; loginUrl: string }) {
  const tasks=resource.data?.tasks ?? [];
  const failures=tasks.filter(t=>t.lastStatus==='error');
  const running=tasks.filter(t=>t.running);
  const ordered=tasks.slice().sort((a,b)=>Number(b.lastStatus==='error')-Number(a.lastStatus==='error') || Number(b.running)-Number(a.running) || (b.lastRunAt ?? 0)-(a.lastRunAt ?? 0));
  return <Section title="Latest task results"><Status resource={resource} loginUrl={loginUrl}/>{resource.data && (tasks.length ? <div className="card task-list"><p className={`task-summary ${failures.length ? 'orange' : ''}`}>{count(failures.length)} failed · {count(running.length)} running</p><p className="caption">Based on each task’s latest result.</p>{ordered.slice(0,5).map(t=><details key={t.id} className="task-row"><summary><span><strong>{maskLogText(t.label)}</strong><small>{t.lastRunAt ? `Last run ${date(t.lastRunAt)}` : 'Never run'}</small></span><span className={t.lastStatus==='error' ? 'orange' : t.running ? 'green' : 'muted'}>{t.running ? 'Running' : t.lastStatus==='error' ? 'Failed' : t.lastStatus==='ok' ? 'OK' : t.lastStatus==='skipped' ? 'Skipped' : 'Not run'}</span></summary>{t.lastError && <p className="orange">{maskLogText(t.lastError)}</p>}<p>{maskLogText(t.description)}</p><Facts items={[
    ['Enabled',t.enabled ? 'Yes' : 'No'],['Last duration',t.lastDurationMs===null ? '—' : duration(t.lastDurationMs)],['Next run',t.nextRunAt===null ? 'Not scheduled' : date(t.nextRunAt)],
  ]}/></details>)}{ordered.length>5 && <details className="secondary-facts"><summary>{ordered.length-5} more tasks</summary>{ordered.slice(5).map(t=><div className="task-extra" key={t.id}><strong>{maskLogText(t.label)}</strong><span>{t.running ? 'Running' : t.lastStatus ?? 'Not run'}</span>{t.lastError && <p className="orange">{maskLogText(t.lastError)}</p>}<small>Last {date(t.lastRunAt ?? undefined)} · Next {date(t.nextRunAt ?? undefined)}</small></div>)}</details>}</div> : <Empty title="No tasks registered">Background tasks will appear when available.</Empty>)}</Section>;
}
export function RecentWarnings({ resource, loginUrl }: { resource: Resource<LogSnapshot>; loginUrl: string }) {
  const logs=resource.data?.logs.flatMap(r=>{const parsed=parseLog(r.seq,r.line,r);return parsed ? [parsed] : [];}) ?? [];
  return <Section title="Recent warnings" action={<a className="text-button" href="#logs">Logs →</a>}><Status resource={resource} loginUrl={loginUrl}/>{resource.data && (logs.length ? <div className="card warning-list">{logs.slice(0,5).map(log=><a href="#logs" className="warning-row" key={log.seq}><div><span className={log.level==='error' || log.level==='fatal' ? 'red' : 'orange'}>{log.level}</span><small>{date(log.ts)}{log.module ? ` · ${maskLogText(log.module)}` : ''}</small></div><p>{log.message}</p></a>)}<p className="caption">Recent retained logs; not a complete error history.</p></div> : <Empty title="No retained warnings">No warnings or errors in the server’s current log buffer.</Empty>)}</Section>;
}
