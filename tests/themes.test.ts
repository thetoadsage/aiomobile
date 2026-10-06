import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaults, loadSettings } from '../src/lib/settings';
import { normalizeTheme, resolveTheme } from '../src/lib/themes';
afterEach(() => vi.unstubAllGlobals());
describe('theme preferences', () => {
  it('migrates existing preferences without dropping their values', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ compact: true, pollingSeconds: 30, chartPoints: 120 }) });
    expect(loadSettings()).toMatchObject({ theme: 'sage', compact: true, pollingSeconds: 30, chartPoints: 120 });
  });
  it('falls back safely for unknown theme IDs and unavailable storage', () => {
    expect(normalizeTheme('unknown')).toBe('sage');
    expect(normalizeTheme({ id: 'paper' })).toBe('sage');
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Storage blocked'); } });
    expect(loadSettings()).toEqual(defaults);
  });
  it('uses device appearance only when the user selects system', () => {
    expect(resolveTheme('system', true)).toBe('sage');
    expect(resolveTheme('system', false)).toBe('paper');
    expect(resolveTheme('midnight', false)).toBe('midnight');
    expect(resolveTheme('glacier', true)).toBe('glacier');
  });
});
