import { afterEach, describe, expect, it, vi } from 'vitest';
import { request, validSnapshot } from '../src/api/client';
import { prepareMonitoring } from '../src/api/monitoring';
import { checkReleases, comparableTag, compareReleases } from '../src/api/version';
import { trackDetails } from '../src/lib/media';
import { mediaSummary, mediaFiles, serverVersion } from './monitoring-fixtures';
afterEach(()=>vi.unstubAllGlobals());
const release=(tag_name:string,prerelease=false)=>({tag_name,prerelease,draft:false});
describe('upstream version and media coverage',()=>{
  it('requests public status outside the dashboard and retains only build information',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,data:{...serverVersion,settings:{secret:'fixture-secret'},users:5}})));vi.stubGlobal('fetch',fetcher);
    expect(await request('https://example.test','/status')).toEqual(serverVersion);
    expect(fetcher).toHaveBeenCalledWith('https://example.test/api/v1/status',expect.objectContaining({credentials:'include',cache:'no-store'}));
    expect(validSnapshot('/status',{version:'2.34.0'})).toBe(true);
    expect(validSnapshot('/status',{...serverVersion,channel:'unknown'})).toBe(false);
    expect(validSnapshot('/status',{version:235})).toBe(false);
  });
  it('compares stable semver and ignores native apps, nightlies and prereleases',()=>{
    const check=compareReleases(serverVersion,[release('v2.36.0'),release('v2.100.0'),release('v2.35.0'),release('v2.99.0',true),release('2026.10.12.0100-nightly',true),release('desktop-v3.0.0')],false);
    expect(check).toMatchObject({latest:'v2.100.0',newer:2,complete:true});
    expect(compareReleases(serverVersion,[release('v2.36.0')],true)).toMatchObject({newer:1,complete:false});
    expect(compareReleases(serverVersion,[],true)).toMatchObject({newer:0,complete:false});
    expect(compareReleases(serverVersion,Array.from({length:100},()=>release('v2.36.0')),false)).toMatchObject({newer:1,complete:false});
    expect(comparableTag({...serverVersion,channel:'dev'})).toBeUndefined();
    expect(comparableTag({...serverVersion,tag:'unknown'})).toBeUndefined();
  });
  it('compares timestamp nightlies only with server nightlies',()=>{
    const status={...serverVersion,channel:'nightly' as const,tag:'2026.10.12.0100-nightly'};
    expect(compareReleases(status,[release('v2.36.0'),release('desktop-nightly'),release('2026.10.13.0100-nightly',true)],false)).toMatchObject({newer:1,latest:'2026.10.13.0100-nightly'});
  });
  it('sends no cookies or referrer to GitHub and preserves rate-limit errors',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify([release('v2.36.0')]),{headers:{link:'<https://api.github.com/next>; rel="next"'}}));vi.stubGlobal('fetch',fetcher);
    expect(await checkReleases(serverVersion,new AbortController().signal)).toMatchObject({newer:1,complete:false});
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('api.github.com/repos/Viren070/AIOStreams/releases?per_page=100'),expect.objectContaining({credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'}));
    fetcher.mockResolvedValue(new Response('',{status:403}));
    await expect(checkReleases(serverVersion,new AbortController().signal)).rejects.toThrow('rate limit');
    expect(()=>compareReleases(serverVersion,{},false)).toThrow('unexpected');
  });
  it('accepts absent and empty coverage but rejects impossible/malformed counters',()=>{
    expect(validSnapshot('/media-info',{...mediaSummary,lookups:undefined})).toBe(true);
    expect(validSnapshot('/media-info',{...mediaSummary,lookups:{eligible:0,filled:0,bySource:{}}})).toBe(true);
    for(const lookups of [{eligible:0,filled:1,bySource:{}},{eligible:100,filled:'2',bySource:{}},{eligible:100,filled:2,bySource:{local:-1}}]) expect(validSnapshot('/media-info',{...mediaSummary,lookups})).toBe(false);
    expect(prepareMonitoring('/media-info',{...mediaSummary,lookupHost:'private.example',backfill:{secret:'fixture-secret'}})).not.toHaveProperty('lookupHost');
  });
  it('retains inspected track details while dropping opaque fields and masking text',()=>{
    const track={index:1,type:'audio',codec:'dts',profile:'DTS:X',original:true,dub:true,visualImpaired:true,commentary:true,title:'api_key=fixture-secret',credentials:'fixture-secret'};
    const files={...mediaFiles,items:[{...mediaFiles.items[0],info:{...mediaFiles.items[0].info,tracks:[track]}}]};
    expect(validSnapshot('/media-info/files',files)).toBe(true);
    const safe=prepareMonitoring('/media-info/files',files) as typeof mediaFiles;
    expect(JSON.stringify(safe)).not.toContain('fixture-secret');
    expect(trackDetails(safe.items[0].info.tracks[0])).toContain('DTS:X');
    expect(trackDetails(safe.items[0].info.tracks[0])).toContain('Audio description');
    expect(trackDetails(mediaFiles.items[0].info.tracks[0])).toContain('10-bit');
    expect(validSnapshot('/media-info/files',{...files,items:[{...files.items[0],info:{...files.items[0].info,tracks:[{...track,hdr:[1]}]}}]})).toBe(false);
  });
});
