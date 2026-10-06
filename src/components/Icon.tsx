export type IconName = 'library' | 'media' | 'check' | 'appearance' | 'logs' | 'filter' | 'overview' | 'streams' | 'usenet' | 'history' | 'more' | 'arrow' | 'back' | 'refresh' | 'settings' | 'indexers' | 'download' | 'activity' | 'close';
const paths: Record<IconName, string> = {
  library: 'M4 4h4v16H4z M10 4h4v16h-4z m7 1 4 14-4 1-4-14z',
  media: 'M4 4h16v16H4z M8 4v16 M16 4v16 M4 8h4 M4 16h4 M16 8h4 M16 16h4 m-9-6 3 2-3 2z',
  check: 'm5 12 4 4L19 6', appearance: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 3v18 M12 7h5 M12 11h8 M12 15h7',
  logs: 'M4 3h16v18H4z M8 7h8 M8 11h8 M8 15h5', filter: 'M4 6h16 M7 12h10 M10 18h4',
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  streams: 'M5 4h14v16H5z M10 8l5 4-5 4z', usenet: 'M12 3v11m-4-4 4 4 4-4 M4 16v5h16v-5',
  history: 'M3 12a9 9 0 1 0 3-6 M3 3v6h6 M12 7v5l3 2', more: 'M5 12h.01 M12 12h.01 M19 12h.01',
  arrow: 'm9 5 7 7-7 7', back: 'm15 5-7 7 7 7', refresh: 'M20 7a9 9 0 1 0 1 8 M20 2v6h-6',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  indexers: 'M4 4h16v16H4z M8 8h8 M8 12h8 M8 16h4', download: 'M12 3v12m-5-5 5 5 5-5 M4 20h16',
  activity: 'M2 12h4l3-8 6 16 3-8h4', close: 'm6 6 12 12 M18 6 6 18',
};
export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
