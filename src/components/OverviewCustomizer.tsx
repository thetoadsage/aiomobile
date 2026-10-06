import { defaultOverview, moveOverview, orderedOverview, overviewSections, type OverviewSectionPreference } from '../lib/overview';
export function OverviewCustomizer({ layout, change }: { layout: OverviewSectionPreference[]; change: (layout: OverviewSectionPreference[]) => void }) {
  const ordered = orderedOverview(layout);
  return <div className="card overview-customizer" id="overview-customizer"><h2>Make it your overview</h2><p className="caption">Pinned sections come first. Reorder within each group; every section stays visible. Changes save on this device.</p><ul>{ordered.map((section, index) => {
    const title = overviewSections.find(item => item.id === section.id)!.title;
    return <li key={section.id}><strong>{title}</strong><div><button type="button" aria-label={`Pin ${title}`} aria-pressed={section.pinned} onClick={() => change(layout.map(item => item.id === section.id ? { ...item, pinned: !item.pinned } : item))}>{section.pinned ? 'Pinned' : 'Pin'}</button><button type="button" aria-label={`Move ${title} up`} disabled={index === 0 || ordered[index - 1].pinned !== section.pinned} onClick={() => change(moveOverview(layout, section.id, -1))}>↑</button><button type="button" aria-label={`Move ${title} down`} disabled={index === ordered.length - 1 || ordered[index + 1].pinned !== section.pinned} onClick={() => change(moveOverview(layout, section.id, 1))}>↓</button></div></li>;
  })}</ul><button type="button" className="text-button" onClick={() => change(defaultOverview())}>Restore default layout</button></div>;
}
