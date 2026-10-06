import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../src/api/client';
import { logExportUrl } from '../src/api/logs';
import { LOG_CAP, LOG_LEVELS, logQuery, mergeLogs, parseLog, safeLogLine, validLogSnapshot } from '../src/lib/logs';
import { logRecords } from './fixtures';
afterEach(()=>vi.unstubAllGlobals());
describe('upstream log contract and bounded client window',()=>{
  it('validates snapshot metadata and preserves the upstream fields',()=>{
    const data={logs:logRecords,nextSeq:30,bufferStats:{entries:30,bytes:4096,maxBytes:1048576,maxEntries:5000,lastSeq:30}};
    expect(validLogSnapshot(data)).toBe(true);expect(validLogSnapshot({...data,logs:[{seq:'30',line:'x'}]})).toBe(false);expect(validLogSnapshot({...data,nextSeq:-1})).toBe(false);
    const row=parseLog(logRecords[0].seq,logRecords[0].line,logRecords[0])!;
    expect(row).toMatchObject({seq:1,ts:logRecords[0].ts,level:'info',module:'usenet',message:'Stream opened for Example.Movie.2026.1080p.mkv'});
    expect(LOG_LEVELS).toContain('fatal');
  });
  it('uses the event ID, rejects absent IDs, and supports plain-text records',()=>{
    expect(parseLog(NaN,'{}')).toBeUndefined();expect(parseLog(0,'{}')).toBeUndefined();
    expect(parseLog(32,'plain message')?.message).toBe('plain message');
    expect(parseLog(40,JSON.stringify({time:'2026-10-03T20:00:00Z',level:'warn',msg:'message',seq:999}))?.seq).toBe(40);
  });
  it('deduplicates replay, keeps ascending sequence order and caps a noisy window',()=>{
    const first=logRecords.map(r=>parseLog(r.seq,r.line,r)!);
    const result=mergeLogs(first,[first[10],first[0],parseLog(31,'new message')!]);
    expect(result).toHaveLength(31);expect(result.at(-1)?.seq).toBe(31);
    const noisy=Array.from({length:1500},(_,i)=>parseLog(i+1,'line')!);
    const capped=mergeLogs([],noisy);expect(capped).toHaveLength(LOG_CAP);expect(capped[0].seq).toBe(501);
  });
  it('maps all supported filters to query parameters and preserves them on both exports',()=>{
    const filters={q:'article (missing)',regex:true,levels:['warn','error'],modules:['nntp','usenet'],since:42,until:1760000000000};
    const qs=new URLSearchParams(logQuery({...filters,limit:200,order:'asc'}));
    expect(Object.fromEntries(qs)).toEqual({q:filters.q,regex:'true',level:'error,warn',module:'nntp,usenet',since:'42',until:'1760000000000',limit:'200',order:'asc'});
    for(const format of ['log','json'] as const){const url=new URL(logExportUrl('https://example.test',filters,format));expect(url.pathname).toBe('/api/v1/dashboard/logs/export');expect(url.searchParams.get('format')).toBe(format);expect(url.searchParams.get('module')).toBe('nntp,usenet');expect(url.searchParams.get('q')).toBe(filters.q);}
    expect(logQuery({q:'hello',regex:false})).not.toContain('regex');
  });
  it('masks nested credentials, auth headers, URL params and prose before copy/export',()=>{
    const raw=JSON.stringify({msg:'Bearer abc123 password=hidden https://user:pass@example.test/?token=tok',metadata:{headers:{cookie:'session'},nested:[{api_key:'key',password:'pass'}]}});
    const safe=safeLogLine(raw);expect(safe).toContain('<redacted>');expect(safe).not.toMatch(/abc123|hidden|:pass@|=tok|"session"|"key"|"pass"/);
    expect(JSON.parse(safe).metadata.headers).toBe('<redacted>');
  });
  it('clear uses authenticated POST, JSON and explicit confirmation',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,data:{cleared:true}})));vi.stubGlobal('fetch',fetcher);
    await request('','/logs/clear',undefined,'POST',{confirm:true});
    expect(fetcher).toHaveBeenCalledWith('/api/v1/dashboard/logs/clear',expect.objectContaining({method:'POST',credentials:'include',cache:'no-store',body:'{"confirm":true}',headers:{Accept:'application/json','Content-Type':'application/json'}}));
  });
  it('recognizes an existing-session login redirect as expired authentication',async()=>{
    const response=new Response('<html>Login</html>');Object.defineProperties(response,{redirected:{value:true},url:{value:'https://example.test/login?next=%2Fmobile%2F'}});
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(response));await expect(request('','/logs')).rejects.toMatchObject({status:401});
  });
});
