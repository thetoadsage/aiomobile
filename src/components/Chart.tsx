import { useId } from 'react';
import { bytes, speed, count } from '../lib/format';
export interface ChartPoint { at: number; value: number }
export function Chart({ points, label, rate = false, color = 'blue', unit = 'bytes', historical = false, gapMs }: { points: ChartPoint[]; label: string; rate?: boolean; color?: 'blue' | 'green'; unit?: 'bytes' | 'count'; historical?: boolean; gapMs?: number }) {
  const id = useId().replace(/:/g,'');
  const data = points.filter(p => Number.isFinite(p.value) && Number.isFinite(p.at)).slice().sort((a,b) => a.at-b.at);
  const peak = Math.max(0, ...data.map(p => Math.max(0,p.value)));
  const max = peak ? 2 ** Math.ceil(Math.log2(peak)) : 1;
  const minTime = data[0]?.at ?? 0;
  const span = Math.max(1, (data.at(-1)?.at ?? 0)-minTime);
  const coords = data.map(p => `${12+(p.at-minTime)/span*516},${112-Math.max(0,p.value)/max*96}`);
  const groups: string[][] = [];
  coords.forEach((coordinate,index) => {
    if (!index || (gapMs && data[index].at-data[index-1].at > gapMs)) groups.push([]);
    groups.at(-1)!.push(coordinate);
  });
  const format = unit === 'count' ? count : rate ? speed : bytes;
  const time = (at: number) => new Date(at).toLocaleString(undefined, span < 86400000 ? {hour:'2-digit',minute:'2-digit'} : {month:'short',day:'numeric'});
  return <div className={`chart ${color}`}>
    <div className="chart-scale"><span>{data.length ? format(peak ? max : 0) : '—'}</span><span>{label}</span></div>
    {data.length > 1 && peak===0 ? <div className="chart-wait">{unit === 'count' ? 'No recorded events in this window' : rate ? 'No throughput in these samples' : 'No usage in this window'}</div> : data.length > 1 ?
      <svg viewBox="0 0 540 128" role="img" aria-label={`${label}, ${data.length} ${historical ? 'recorded buckets' : 'samples'}. Latest ${format(data.at(-1)?.value)}`}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".22"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
        {[16,48,80,112].map(y => <line key={y} x1="12" x2="528" y1={y} y2={y} stroke="currentColor" strokeOpacity=".1" strokeDasharray="3 5"/>)}
        {groups.map((group,index) => <g key={index}>
          {group.length > 1 && <><path d={`M${group.join(' L')} L${group.at(-1)!.split(',')[0]},112 L${group[0].split(',')[0]},112 Z`} fill={`url(#${id})`}/><polyline points={group.join(' ')} stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round"/></>}
          <circle cx={group.at(-1)?.split(',')[0]} cy={group.at(-1)?.split(',')[1]} r="3.5" fill="currentColor"/>
        </g>)}
      </svg> : <div className="chart-wait">{data.length ? historical ? `One recorded bucket · ${format(data[0].value)}` : 'Collecting live samples…' : historical ? 'No recorded buckets in this window' : 'No usage samples in this window'}</div>}
    <div className="chart-axis"><span>{data.length ? time(minTime) : '—'}</span><span>{data.length > 1 ? time(data.at(-1)!.at) : '—'}</span></div>
  </div>;
}
