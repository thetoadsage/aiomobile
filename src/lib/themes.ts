export const themes = [
  { id: 'sage', name: 'Sage', description: 'Charcoal & soft green', scheme: 'dark' },
  { id: 'midnight', name: 'Midnight', description: 'Deep navy & sky blue', scheme: 'dark' },
  { id: 'ember', name: 'Ember', description: 'Warm graphite & apricot', scheme: 'dark' },
  { id: 'paper', name: 'Paper', description: 'Warm white & forest', scheme: 'light' },
  { id: 'glacier', name: 'Glacier', description: 'Cool white & ocean blue', scheme: 'light' },
] as const;
export type ThemeId = typeof themes[number]['id'];
export type ThemePreference = ThemeId | 'system';
export function normalizeTheme(value: unknown): ThemePreference {
  return value === 'system' || themes.some(theme => theme.id === value) ? value as ThemePreference : 'sage';
}
export function resolveTheme(preference: ThemePreference, dark: boolean): ThemeId {
  return preference === 'system' ? dark ? 'sage' : 'paper' : preference;
}
export function applyTheme(preference: ThemePreference) {
  const id = resolveTheme(preference, matchMedia('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.dataset.theme = id;
  root.style.colorScheme = themes.find(theme => theme.id === id)!.scheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--background').trim());
}
