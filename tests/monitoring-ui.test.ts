import { describe, expect, it } from 'vitest';
import { collectAttention } from '../src/lib/attention';
import { defaultOverview, moveOverview, normalizeOverview, orderedOverview } from '../src/lib/overview';
import { filePosition, retainFilePositions, selectStreams } from '../src/lib/streams';
import { liveStreams, liveUsenet, stats } from './fixtures';

describe('file position across range reads', () => {
  const stream = {...liveStreams.streams[0], size:1000, bytesServed:5000};
  it('includes the offset when new range requests reset their byte counter', () => {
    expect(filePosition({...stream,start:300,currentBytes:100})).toBe(40);
    expect(filePosition({...stream,start:400,currentBytes:0})).toBe(40);
    expect(filePosition({...stream,start:400,currentBytes:100})).toBe(50);
    expect(filePosition({...stream,start:100,currentBytes:0})).toBe(10);
    expect(filePosition({...stream,start:0,currentBytes:0})).toBe(0);
    expect(filePosition({...stream,start:900,currentBytes:200})).toBe(100);
  });
  it('keeps paused open reads but does not interpret closed reads as 0%', () => {
    expect(filePosition({...stream,activity:'paused',start:400,currentBytes:100})).toBe(50);
    expect(filePosition({...stream,activeReads:0,activity:'streaming',start:0,currentBytes:0})).toBeUndefined();
    expect(filePosition({...stream,activeReads:0,activity:'idle',start:0,currentBytes:0})).toBeUndefined();
    expect(filePosition({...stream,size:0})).toBeUndefined();
  });
  it('does not fabricate a position from invalid or missing range fields', () => {
    expect(filePosition({...stream,start:NaN})).toBeUndefined();
    expect(filePosition({...stream,start:-1})).toBeUndefined();
    expect(filePosition({...stream,currentBytes:Infinity})).toBeUndefined();
  });
});

describe('furthest observed file position', () => {
  const stream = { ...liveStreams.streams[0], size: 1000, activeReads: 1, start: 600, currentBytes: 60 };
  it('holds through closed reads and backward seeks, then advances on a higher observation', () => {
    let positions = retainFilePositions(new Map(), [stream]);
    expect(positions.get(stream.id)?.percent).toBe(66);
    for (const read of [{ activeReads: 0, start: 0, currentBytes: 0 }, { activeReads: 1, start: 100, currentBytes: 0 }, { size: 0 }]) {
      positions = retainFilePositions(positions, [{ ...stream, ...read }]);
      expect(positions.get(stream.id)?.percent).toBe(66);
    }
    positions = retainFilePositions(positions, [{ ...stream, start: 700, currentBytes: 0 }]);
    expect(positions.get(stream.id)?.percent).toBe(70);
    positions = retainFilePositions(positions, [{ ...stream, start: 990, currentBytes: 20 }]);
    expect(positions.get(stream.id)?.percent).toBe(100);
  });
  it('keeps zero as a valid observation and leaves never-observed sessions unavailable', () => {
    let positions = retainFilePositions(new Map(), [{ ...stream, start: 0, currentBytes: 0 }]);
    positions = retainFilePositions(positions, [{ ...stream, activeReads: 0 }]);
    expect(positions.get(stream.id)?.percent).toBe(0);
    expect(retainFilePositions(new Map(), [{ ...stream, activeReads: 0 }]).has(stream.id)).toBe(false);
  });
  it('isolates sessions, prunes ended ones, and resets if a session ID has a different start time', () => {
    const second = { ...stream, id: 'another-session', start: 200, currentBytes: 0 };
    const initial = retainFilePositions(new Map(), [stream, second]);
    expect(initial.get(second.id)?.percent).toBe(20);
    expect(retainFilePositions(initial, [second]).has(stream.id)).toBe(false);
    expect(retainFilePositions(initial, [{ ...stream, startedAt: stream.startedAt + 1, activeReads: 0 }]).has(stream.id)).toBe(false);
    expect(retainFilePositions(retainFilePositions(initial, []), [{ ...stream, activeReads: 0 }]).size).toBe(0);
  });
});

describe('attention is evidence-based and links to specific sources', () => {
  it('does not flag idle, disabled, no-grab, or historical-error-only sources', () => {
    const providers = [{...liveUsenet.pool.providers[0], acquired:0, queued:0, tripped:true, state:'offline' as const}, {...liveUsenet.pool.providers[0],id:'disabled',state:'disabled' as const,tripped:true}];
    const clean = {...stats,indexers:[{...stats.indexers[0],grabs:0,failed:0,fetchAuth:0,fetchLimited:0}],providers:[{...stats.providers[0],errorRate:.9,missRate:.9}]};
    expect(collectAttention(providers,clean)).toEqual([]);
  });
  it('counts affected sources once and encodes names in links', () => {
    const providers=[{...liveUsenet.pool.providers[0],id:'p/1',tripped:true,throttled:true}];
    const data={...stats,indexers:[{...stats.indexers[0],indexer:'My indexer / one',fetchAuth:1}]};
    const attention=collectAttention(providers,data);
    expect(attention).toHaveLength(2);
    expect(attention[0]).toMatchObject({href:'#provider/p%2F1',details:'Circuit breaker active · Provider throttled'});
    expect(attention[1]).toMatchObject({href:'#indexers/My%20indexer%20%2F%20one',details:'2 failed imports · 1 auth failure · last 24h'});
  });
});

describe('overview section preferences', () => {
  it('migrates partial layouts, removes duplicates, and ignores unknown sections', () => {
    expect(normalizeOverview([{id:'tasks',pinned:true},{id:'bandwidth',pinned:true},{id:'bandwidth'},{id:'bogus'},null])).toEqual([{id:'bandwidth',pinned:true,visible:true},{id:'streams',pinned:false,visible:true},{id:'providers',pinned:false,visible:true},{id:'system',pinned:false,visible:true},{id:'warnings',pinned:false,visible:true},{id:'version',pinned:false,visible:true}]);
    expect(normalizeOverview('bad')).toEqual(defaultOverview());
  });
  it('retains explicit hidden preferences and defaults older or malformed visibility to shown', () => {
    const layout=normalizeOverview([{id:'system',pinned:true,visible:false},{id:'streams',visible:'false'},{id:'providers',visible:null}]);
    expect(layout[0]).toEqual({id:'system',pinned:true,visible:false});
    expect(layout.slice(1).every(section=>section.visible)).toBe(true);
    expect(normalizeOverview(JSON.parse(JSON.stringify(layout)))).toEqual(layout);
    const hidden=defaultOverview().map(section=>({...section,visible:false}));
    expect(normalizeOverview(hidden)).toEqual(hidden);
  });
  it('moves past hidden sections without losing their position or crossing pinned groups', () => {
    const layout=defaultOverview();layout[1].visible=false;layout[4].visible=false;layout[4].pinned=true;
    const moved=moveOverview(layout,'bandwidth',-1);
    expect(moved.filter(section=>section.visible).map(section=>section.id)).toEqual(['bandwidth','streams','system','version']);
    expect(moved.findIndex(section=>section.id==='providers')).toBe(orderedOverview(layout).findIndex(section=>section.id==='providers'));
    expect(moveOverview(layout,'warnings',1)).toEqual(orderedOverview(layout));
    expect(moveOverview(layout,'streams',-1)).toEqual(orderedOverview(layout));
    expect(layout[0].id).toBe('streams');
  });
  it('pins first, reorders within groups, and does not mutate saved preferences', () => {
    const layout=defaultOverview();layout[2].pinned=true;
    expect(orderedOverview(layout).map(x=>x.id)).toEqual(['bandwidth','streams','providers','system','warnings','version']);
    expect(moveOverview(layout,'providers',-1).map(x=>x.id)).toEqual(['bandwidth','providers','streams','system','warnings','version']);
    expect(moveOverview(layout,'streams',-1).map(x=>x.id)).toEqual(['bandwidth','streams','providers','system','warnings','version']);
    expect(layout.map(x=>x.id)).toEqual(['streams','providers','bandwidth','system','warnings','version']);
  });
});

describe('stream discovery', () => {
  it('combines case-insensitive filename/user search with transport filters', () => {
    expect(selectStreams(liveStreams.streams,'  ALEX  ','usenet','recent').map(x=>x.id)).toEqual(['stream-1']);
    expect(selectStreams(liveStreams.streams,'planet','proxy','recent').map(x=>x.id)).toEqual(['stream-2']);
    expect(selectStreams(liveStreams.streams,'alex','proxy','recent')).toEqual([]);
  });
  it('sorts without mutating live snapshots and breaks equal values deterministically', () => {
    const before=liveStreams.streams.map(x=>x.id);
    expect(selectStreams(liveStreams.streams,'','all','recent').map(x=>x.id)).toEqual(['stream-2','stream-1']);
    expect(selectStreams(liveStreams.streams,'','all','throughput').map(x=>x.id)).toEqual(before);
    const tied=[{...liveStreams.streams[0],id:'z'},{...liveStreams.streams[0],id:'a'}];
    expect(selectStreams(tied,'','all','throughput').map(x=>x.id)).toEqual(['a','z']);
    expect(liveStreams.streams.map(x=>x.id)).toEqual(before);
  });
});
