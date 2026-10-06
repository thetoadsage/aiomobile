import { describe, expect, it } from 'vitest';
import { collectAttention } from '../src/lib/attention';
import { defaultOverview, moveOverview, normalizeOverview, orderedOverview } from '../src/lib/overview';
import { filePosition, selectStreams } from '../src/lib/streams';
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

describe('overview layout preserves every section', () => {
  it('migrates partial layouts, removes duplicates, and ignores unknown sections', () => {
    expect(normalizeOverview([{id:'tasks',pinned:true},{id:'bandwidth',pinned:true},{id:'bandwidth'},{id:'bogus'},null])).toEqual([{id:'bandwidth',pinned:true},{id:'streams',pinned:false},{id:'providers',pinned:false},{id:'system',pinned:false},{id:'warnings',pinned:false}]);
    expect(normalizeOverview('bad')).toEqual(defaultOverview());
  });
  it('pins first, reorders within groups, and does not mutate saved preferences', () => {
    const layout=defaultOverview();layout[2].pinned=true;
    expect(orderedOverview(layout).map(x=>x.id)).toEqual(['bandwidth','streams','providers','system','warnings']);
    expect(moveOverview(layout,'providers',-1).map(x=>x.id)).toEqual(['bandwidth','providers','streams','system','warnings']);
    expect(moveOverview(layout,'streams',-1).map(x=>x.id)).toEqual(['bandwidth','streams','providers','system','warnings']);
    expect(layout.map(x=>x.id)).toEqual(['streams','providers','bandwidth','system','warnings']);
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
