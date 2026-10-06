import { bytes, percent } from '../lib/format';
import { usageRatio } from '../lib/usage';
export function UsageGauge({ used, limit, label }: { used: number; limit: number; label: string }) {
  const ratio = usageRatio(used, limit);
  if (ratio === undefined) return <p className="caption">No bandwidth limit configured.</p>;
  return <div className="usage-gauge"><p className={ratio >= 1 ? 'orange' : 'caption'}>{percent(ratio)} of {bytes(limit)} used</p><meter min={0} max={limit} value={Math.min(used,limit)} aria-label={label} aria-valuetext={`${bytes(used)} of ${bytes(limit)}; ${percent(ratio)} used`}/></div>;
}
