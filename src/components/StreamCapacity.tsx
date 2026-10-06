import type { LiveStreams } from '../api/types';
import { count } from '../lib/format';
export function StreamCapacity({ snapshot }: { snapshot?: LiveStreams }) {
  if (!snapshot) return null;
  const open = snapshot.streams.filter(stream => stream.activeReads > 0).length;
  return <div className="stream-capacity"><p className="caption">{snapshot.summary.connectionLimit ? `Global stream cap: ${count(snapshot.summary.connectionLimit)}` : 'No global stream cap'} · {count(open)} {open === 1 ? 'session reports' : 'sessions report'} open reads.</p><p className="caption">Idle sessions use no slot. Other replicas may omit open-read counts.</p></div>;
}
