import type { UsenetWindow } from '../api/types';
export function UsenetWindowPicker({ window, change }: { window: UsenetWindow; change: (window: UsenetWindow) => void }) {
  return <div className="segmented" aria-label="Usenet statistics period">{(['24h','7d','30d','all'] as const).map(value => <button key={value} aria-pressed={value === window} onClick={() => change(value)}>{value === 'all' ? 'All' : value.toUpperCase()}</button>)}</div>;
}
