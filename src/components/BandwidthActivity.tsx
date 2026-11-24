import { useState } from 'react';
import type { BandwidthOverview } from '../api/types';
import { bytes } from '../lib/format';
import { recordedSeries } from '../lib/recordedChart';
import { Section } from './UI';

const dayMs = 86_400_000;
const gib = 1024 ** 3;
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' });
const fullDay = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

export function BandwidthActivity({ data }: { data: BandwidthOverview }) {
  const [selected, setSelected] = useState<number>();
  if (data.bucketMs !== dayMs) return null;
  const series = recordedSeries(data.series.map(point => ({ at: point.bucketMs, value: point.bytes })), dayMs, data.sinceMs, data.generatedAt);
  const last = Math.floor(series.end / dayMs) * dayMs;
  const values = new Map(series.buckets.map(bucket => [bucket.at, bucket.value]));
  const days = Array.from({ length: 7 }, (_, index) => last - (6 - index) * dayMs);
  const active = selected !== undefined && days.includes(selected) ? selected : last;
  const valueLabel = (day: number) => {
    const value = values.get(day);
    const partial = day + dayMs > series.end || day < data.sinceMs;
    return [value === undefined ? 'No recorded bucket' : `${bytes(value)} served`, partial ? 'Partial day' : ''].filter(Boolean).join(' · ');
  };

  return <Section title="Bandwidth activity" action={<span className="muted">UTC days</span>}>
    <div className="card chart-card bandwidth-activity">
      <div className="bandwidth-activity-days" role="group" aria-label="Daily recorded bandwidth">
        {days.map(day => {
          const value = values.get(day);
          const level = value === undefined ? 'missing' : value === 0 ? 'zero' : value < 10 * gib ? 'low' : value < 25 * gib ? 'medium' : 'high';
          return <button type="button" key={day} aria-pressed={active === day} aria-label={`${fullDay.format(day)} UTC, ${valueLabel(day)}`} onClick={() => setSelected(day)}>
            {weekday.format(day)}<span data-level={level} aria-hidden="true"/>
          </button>;
        })}
      </div>
      <div className="bandwidth-activity-key" aria-label="Bandwidth legend">
        <span><i data-level="missing"/>No data</span><span><i data-level="zero"/>0 B</span>
        <span><i data-level="low"/>&lt;10 GB</span><span><i data-level="medium"/>10–&lt;25 GB</span><span><i data-level="high"/>25+ GB</span>
      </div>
      <output className="bandwidth-activity-detail"><span>{fullDay.format(active)} UTC</span><strong>{valueLabel(active)}</strong></output>
    </div>
  </Section>;
}
