import { afterEach, describe, expect, it, vi } from 'vitest';
import { request, validSnapshot } from '../src/api/client';
import { normalizeBase } from '../src/lib/settings';
import { bytes, percent, progress } from '../src/lib/format';
import { liveStreams, liveUsenet, bandwidth, stats } from './fixtures';
afterEach(()=>vi.unstubAllGlobals());
describe('verified dashboard contracts',()=>{
  it('accepts upstream-shaped snapshots and rejects envelopes on SSE',()=>{
    expect(validSnapshot('/streams/live',liveStreams)).toBe(true);
    expect(validSnapshot('/usenet/live',liveUsenet)).toBe(true);
    expect(validSnapshot('/streams/bandwidth',bandwidth)).toBe(true);
    expect(validSnapshot('/usenet/stats',stats)).toBe(true);
    expect(validSnapshot('/streams/live',{success:true,data:liveStreams})).toBe(false);
    expect(validSnapshot('/usenet/live',{...liveUsenet,pool:{providers:[{}]}})).toBe(false);
  });
  it('rejects malformed provider and indexer frames before rendering',()=>{
    expect(validSnapshot('/usenet/live',{...liveUsenet,pool:{providers:[{...liveUsenet.pool.providers[0],state:null}]}})).toBe(false);
    expect(validSnapshot('/usenet/stats',{...stats,indexers:[{...stats.indexers[0],successRate:null}]})).toBe(false);
  });
  it('requires a finite range start for accurate stream positions',()=>{
    for (const start of [undefined,null,'0',NaN,Infinity]) {
      expect(validSnapshot('/streams/live',{...liveStreams,streams:[{...liveStreams.streams[0],start}]})).toBe(false);
    }
  });
  it('unwraps REST and uses session cookies without caching',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,data:liveStreams}),{status:200}));vi.stubGlobal('fetch',fetcher);
    expect(await request('','/streams/live')).toEqual(liveStreams);
    expect(fetcher).toHaveBeenCalledWith('/api/v1/dashboard/streams/live',expect.objectContaining({credentials:'include',cache:'no-store',headers:{Accept:'application/json'}}));
  });
  it.each([401,403])('preserves auth status %s for retry suspension',async status=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status})));
    await expect(request('','/streams/live')).rejects.toMatchObject({status});
  });
  it('rejects incompatible REST responses and HTML login redirects',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,data:{streams:[]}}),{status:200})));
    await expect(request('','/streams/live')).rejects.toThrow('incompatible');
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('<html>Login</html>',{status:200})));
    await expect(request('','/streams/live')).rejects.toThrow('unexpected response');
  });
  it('rejects credential-bearing base URLs and mixed content',()=>{
    vi.stubGlobal('location',{protocol:'https:'});
    for(const url of ['https://user:secret@example.test','https://example.test?key=secret','https://example.test#secret','http://example.test','javascript:alert(1)'])expect(()=>normalizeBase(url)).toThrow();
    expect(normalizeBase('https://aio.example.test/')).toBe('https://aio.example.test');
    expect(normalizeBase('')).toBe('');
  });
  it('distinguishes file position, unknown size, and fractional rates',()=>{
    expect(progress(3,12)).toBe(25);expect(progress(20,12)).toBe(100);expect(progress(1,0)).toBeUndefined();expect(percent(.98)).toBe('98.0%');expect(bytes(1024**3)).toBe('1 GB');
  });
});
