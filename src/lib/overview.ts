export const overviewSections = [
  { id: 'streams', title: 'Active streams' },
  { id: 'providers', title: 'Usenet health' },
  { id: 'bandwidth', title: 'Bandwidth' },
  { id: 'system', title: 'System' },
  { id: 'warnings', title: 'Recent warnings' },
  { id: 'version', title: 'AIOStreams version' },
] as const;
export type OverviewSectionId = typeof overviewSections[number]['id'];
export interface OverviewSectionPreference { id: OverviewSectionId; pinned: boolean; visible: boolean }
export const defaultOverview = (): OverviewSectionPreference[] => overviewSections.map(({ id }) => ({ id, pinned: false, visible: true }));
export function normalizeOverview(value: unknown): OverviewSectionPreference[] {
  if (!Array.isArray(value)) return defaultOverview();
  const result: OverviewSectionPreference[] = [];
  for (const entry of value) {
    if (entry && overviewSections.some(section => section.id === entry.id) && !result.some(section => section.id === entry.id)) result.push({ id: entry.id, pinned: entry.pinned === true, visible: entry.visible !== false });
  }
  return [...result, ...defaultOverview().filter(section => !result.some(saved => saved.id === section.id))];
}
export function orderedOverview(layout: OverviewSectionPreference[]) {
  return [...layout.filter(section => section.pinned), ...layout.filter(section => !section.pinned)];
}
export function moveOverview(layout: OverviewSectionPreference[], id: OverviewSectionId, direction: -1 | 1) {
  const next = orderedOverview(layout);
  const index = next.findIndex(section => section.id === id);
  if (index < 0 || !next[index].visible) return next;
  let target = index + direction;
  while (next[target] && !next[target].visible) target += direction;
  if (!next[target] || next[index].pinned !== next[target].pinned) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
