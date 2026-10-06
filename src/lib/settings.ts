import { defaultOverview, normalizeOverview, type OverviewSectionPreference } from './overview';
import { normalizeTheme, type ThemePreference } from './themes';
export interface Settings { baseUrl: string; pollingSeconds: number; historySeconds: number; chartPoints: number; reducedMotion: boolean; compact: boolean; theme: ThemePreference; overview: OverviewSectionPreference[] }
export const defaults: Settings = { baseUrl: '', pollingSeconds: 15, historySeconds: 60, chartPoints: 60, reducedMotion: false, compact: false, theme: 'sage', overview: defaultOverview() };
export function normalizeBase(value: string): string {
  if (!value.trim()) return '';
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Use an HTTP(S) URL without credentials, query parameters, or a fragment.');
  if (location.protocol === 'https:' && url.protocol !== 'https:') throw new Error('An HTTPS app requires an HTTPS instance.');
  return url.origin + url.pathname.replace(/\/+$/, '');
}
export function loadSettings(): Settings {
  try {
    const raw = JSON.parse(localStorage.getItem('aiomobile.preferences') ?? '{}');
    return { baseUrl: typeof raw.baseUrl === 'string' ? normalizeBase(raw.baseUrl) : '',
      pollingSeconds: [15, 30, 60].includes(raw.pollingSeconds) ? raw.pollingSeconds : 15,
      historySeconds: raw.historySeconds === 30 ? 30 : 60,
      chartPoints: [30, 60, 120].includes(raw.chartPoints) ? raw.chartPoints : 60,
      reducedMotion: raw.reducedMotion === true, compact: raw.compact === true, theme: normalizeTheme(raw.theme), overview: normalizeOverview(raw.overview) };
  } catch { return defaults; }
}
export function saveSettings(settings: Settings) { localStorage.setItem('aiomobile.preferences', JSON.stringify(settings)); }
