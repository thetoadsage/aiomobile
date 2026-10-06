import { memo } from 'react';
import type { LiveStreamSession } from '../api/types';
import { bytes, speed, duration } from '../lib/format';
import { filePosition } from '../lib/streams';
import { Badge } from './UI';
import { Icon } from './Icon';
function StreamCardView({ stream, open }: { stream: LiveStreamSession; open: (id: string) => void }) {
  const pct = filePosition(stream);
  return <button className="card stream-card" onClick={() => open(stream.id)}>
    <div className="stream-top">
      <span className={`stream-avatar ${stream.transport}`}><Icon name={stream.transport === 'usenet' ? 'download' : 'streams'} size={21}/></span>
      <div className="stream-title"><span>{stream.username} <span className="stream-transport">· {stream.transport === 'usenet' ? 'Usenet' : 'Proxy'}</span></span><h3 title={stream.filename}>{stream.filename || 'Unnamed stream'}</h3></div>
      <Icon name="arrow" size={18}/>
    </div>
    <div className="stream-badges"><Badge state={stream.activity}><i/>{stream.activity}</Badge><strong className="stream-speed">{speed(stream.bytesPerSec)}</strong></div>
    <div className="stream-position"><span>File position</span><strong>{pct === undefined ? stream.size > 0 ? 'Unavailable' : 'Size unknown' : `${Math.round(pct)}%`}</strong></div>
    <div className="progress" style={{ visibility: pct === undefined ? 'hidden' : undefined }}><div style={{ width: `${pct ?? 0}%` }}/></div>
    <div className="stream-foot"><span>{bytes(stream.bytesServed)} served</span><span>{bytes(stream.size)} file</span></div>
    <small className="stream-start">Started {duration(Date.now() - stream.startedAt)} ago</small>
  </button>;
}
export const StreamCard = memo(StreamCardView);
