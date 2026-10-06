import { useSyncExternalStore } from 'react';
export type DiagnosticEvent = 'SSE connected' | 'SSE disconnected' | 'REST fallback entered' | 'API response failure' | 'Authentication failure' | 'Live frame rejected' | 'Service worker update ready' | 'Service worker unavailable' | 'Service worker update requested';
interface Entry { at: number; event: DiagnosticEvent; source: 'Streams' | 'Usenet' | 'History' | 'Logs' | 'System' | 'Tasks' | 'Library' | 'Media Info' | 'Addons' | 'App'; status?: number }
let entries: Entry[] = [];
const listeners = new Set<() => void>();
// Accept only enums and numeric status codes: never response bodies, URLs or errors.
export function diagnose(event: DiagnosticEvent, source: Entry['source'], status?: number) {
  const last = entries.at(-1);
  if (last?.event === event && last.source === source && last.status === status && Date.now() - last.at < 5000) return;
  entries = [...entries, { at: Date.now(), event, source, ...(status ? { status } : {}) }].slice(-80);
  listeners.forEach(listener => listener());
}
export function clearDiagnostics() { entries = []; listeners.forEach(listener => listener()); }
export function useDiagnostics() { return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => entries); }

export function diagnosticSource(path: string): Entry['source'] {
  if(path.startsWith('/analytics/addons')) return 'Addons';
  if(path.startsWith('/system')) return 'System';
  if(path.startsWith('/tasks')) return 'Tasks';
  if(path.startsWith('/media-info')) return 'Media Info';
  if(path.startsWith('/usenet/library')) return 'Library';
  if(path.startsWith('/logs')) return 'Logs';
  if(path.startsWith('/usenet')) return 'Usenet';
  if(path.startsWith('/streams/live') || path.startsWith('/streams/sessions')) return 'Streams';
  return 'History';
}
