export function bytes(value?: number, digits = 1): string {
  if (value === undefined || !Number.isFinite(value)) return '—';
  if (value === 0) return '0 B';
  const units = ['B','KB','MB','GB','TB','PB'];
  const index = Math.min(Math.max(0, Math.floor(Math.log(Math.abs(value))/Math.log(1024))), units.length-1);
  return `${(value / 1024 ** index).toLocaleString(undefined, { maximumFractionDigits: index ? digits : 0 })} ${units[index]}`;
}
export const speed = (value?: number) => value === undefined ? '—' : `${bytes(value)}/s`;
export const count = (value?: number) => value === undefined || !Number.isFinite(value) ? '—' : value.toLocaleString();
export const percent = (value?: number) => value === undefined || !Number.isFinite(value) ? '—' : `${(value*100).toFixed(1)}%`;
export const date = (value?: number) => value ? new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
export function duration(ms: number) { const seconds = Math.max(0, Math.floor(ms/1000)); return seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds/60)}m ${seconds%60}s` : `${Math.floor(seconds/3600)}h ${Math.floor(seconds%3600/60)}m`; }
export const progress = (current: number, size: number) => size > 0 ? Math.min(100, Math.max(0,current/size*100)) : undefined;
