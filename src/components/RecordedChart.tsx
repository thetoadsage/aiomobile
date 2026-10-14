import { useEffect, useId, useRef, useState } from 'react';
import { bytes, count } from '../lib/format';
import { recordedSelection, recordedSeries, type RecordedPoint } from '../lib/recordedChart';

export function RecordedChart({ points, label, bucketMs, from, to, unit = 'bytes', color = 'blue' }: { points: RecordedPoint[]; label: string; bucketMs: number; from: number; to: number; unit?: 'bytes' | 'count'; color?: 'blue' | 'green' }) {
  const id = useId().replace(/:/g, '');
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [selection, setSelection] = useState<{ at: number; interval: number }>();
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(160, entry.contentRect.width)));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const series = recordedSeries(points, bucketMs, from, to);
  const { start, end, interval, buckets, total, slots } = series;
  const selectedIndex = selection?.interval === interval && selection.at >= start && selection.at <= end ? Math.min(slots - 1, Math.floor((selection.at - start) / interval)) : slots - 1;
  const selected = recordedSelection(series, selectedIndex);
  const format = unit === 'count' ? count : bytes;
  const height = 200, left = Math.max(52, ...[0, total / 2, total].map(value => format(value).length * 7 + 12)), right = 12, top = 28, bottom = 28;
  const plotWidth = width - left - right, baseline = height - bottom;
  const ceiling = total > 0 ? total * 1.16 : 1;
  const x = (at: number) => left + Math.max(0, Math.min(1, (at - start) / Math.max(1, end - start))) * plotWidth;
  const y = (value: number) => baseline - value / ceiling * (baseline - top);
  let path = `M${left},${baseline}`;
  for (const bucket of buckets) path += ` H${x(bucket.end)} V${y(bucket.total)}`;
  path += ` H${x(end)}`;
  const time = (at: number, detailed = false) => new Date(at).toLocaleString(undefined, detailed || end - start > 2 * 86400000 ? { month: 'short', day: 'numeric', ...(detailed ? { hour: 'numeric', minute: '2-digit' } as const : {}) } : { hour: 'numeric', minute: '2-digit' });
  const range = `${time(selected.at, true)} – ${time(selected.end, true)}`;
  const detail = `${selected.value === undefined ? 'No recorded bucket' : `${format(selected.value)} added`} · ${format(selected.total)} accumulated`;
  const inspect = (index: number) => setSelection({ at: start + index * interval, interval });
  const ticks = width < 400 ? [0, .5, 1] : [0, .25, .5, .75, 1];
  return <div ref={container} className={`recorded-chart ${color}`}>
    <div className="recorded-chart-heading"><span>{label}</span><strong>{format(total)}<small>Recorded bucket total</small></strong></div>
    {!buckets.length ? <div className="chart-wait">No recorded buckets in this window</div> : <>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}, ${buckets.length} recorded buckets. Accumulated ${format(total)}. Flat sections mean no additional activity recorded.`} onPointerDown={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const at = start + Math.max(0, Math.min(1, ((event.clientX - bounds.left) / bounds.width * width - left) / plotWidth)) * (end - start);
        inspect(Math.min(slots - 1, Math.max(0, Math.ceil((at - start) / interval) - 1)));
      }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".26"/><stop offset="100%" stopColor="currentColor" stopOpacity=".035"/></linearGradient></defs>
        {[0, total / 2, total].filter((value, index, values) => values.indexOf(value) === index).map(value => <g key={value}><line x1={left} x2={width - right} y1={y(value)} y2={y(value)} className="recorded-grid"/><text x={left - 8} y={y(value) + 4} textAnchor="end">{format(value)}</text></g>)}
        <path d={`${path} L${x(end)},${baseline} Z`} fill={`url(#${id})`}/>
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
        <line x1={x(selected.end)} x2={x(selected.end)} y1={top} y2={baseline} className="recorded-guide"/>
        <circle cx={x(selected.end)} cy={y(selected.total)} r="4" fill="currentColor"/>
        {ticks.map(tick => <text key={tick} x={left + plotWidth * tick} y={height - 6} textAnchor={tick === 0 ? 'start' : tick === 1 ? 'end' : 'middle'}>{time(start + (end - start) * tick)}</text>)}
      </svg>
      <div className="recorded-inspection">
        <label htmlFor={`${id}-hour`}>{range}{selected.end - selected.at < interval && <span className="muted"> · Partial bucket</span>}</label>
        <output htmlFor={`${id}-hour`}>{detail}</output>
        <input id={`${id}-hour`} type="range" min="0" max={slots - 1} step="1" value={selectedIndex} onChange={event => inspect(Number(event.target.value))} aria-label={`Inspect ${label} recorded bucket`} aria-valuetext={`${range}: ${detail}`}/>
      </div>
    </>}
    <p className="caption">Accumulated from retained buckets. Flat sections mean no additional activity recorded; history may be incomplete.</p>
  </div>;
}
