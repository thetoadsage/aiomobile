import { afterEach, describe, expect, it, vi } from 'vitest';
import { request, validSnapshot } from '../src/api/client';
import { prepareMonitoring } from '../src/api/monitoring';
import { librarySnapshot, mediaSummary, mediaLive, probeAttempts, mediaFiles, systemMetrics, tasksSnapshot } from './monitoring-fixtures';
afterEach(()=>vi.unstubAllGlobals());
describe('read-only dashboard contracts',()=>{
  it.each([
    ['/system',systemMetrics],['/tasks',tasksSnapshot],['/usenet/library?limit=20',librarySnapshot],['/media-info',mediaSummary],['/media-info/live',mediaLive],['/media-info/probes',probeAttempts],['/media-info/files',mediaFiles],
  ])('accepts the inspected %s shape and rejects wrapped SSE', (path,data)=>{
    expect(validSnapshot(path,data)).toBe(true);
    expect(validSnapshot(path,{success:true,data})).toBe(false);
  });
  it('rejects missing or malformed fields before they reach the UI',()=>{
    expect(validSnapshot('/system',{...systemMetrics,memory:{...systemMetrics.memory,rss:null}})).toBe(false);
    expect(validSnapshot('/tasks',{...tasksSnapshot,tasks:[{...tasksSnapshot.tasks[0],lastStatus:'success'}]})).toBe(false);
    expect(validSnapshot('/usenet/library',{...librarySnapshot,entries:[{...librarySnapshot.entries[0],files:[{size:'1024'}]}]})).toBe(false);
    expect(validSnapshot('/media-info',{...mediaSummary,day:{...mediaSummary.day,medianMs:'fast'}})).toBe(false);
    expect(validSnapshot('/media-info/live',{...mediaLive,jobs:[{...mediaLive.jobs[0],stage:'done'}]})).toBe(false);
    expect(validSnapshot('/media-info/files',{...mediaFiles,items:[{...mediaFiles.items[0],info:{...mediaFiles.items[0].info,tracks:[{index:0,type:'audio',channels:'six'}]}}]})).toBe(false);
  });
  it('drops secrets and opaque metadata from library responses before retention', async()=>{
    const entry={...librarySnapshot.entries[0],password:'fixture-password',nzbUrl:'https://example.test/?apikey=fixture-nzb-secret',files:[{...librarySnapshot.entries[0].files[0],layout:{password:'fixture-layout-secret'}}]};
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,data:{total:1,entries:[entry]}}),{status:200})));
    const value=await request('','/usenet/library?limit=20');
    expect(JSON.stringify(value)).not.toMatch(/fixture-password|fixture-nzb-secret|fixture-layout-secret|nzbUrl|layout/);
  });
  it('masks error text and discards release identities from probe jobs and files',()=>{
    expect(JSON.stringify(prepareMonitoring('/tasks',tasksSnapshot))).not.toContain('fixture-task-secret');
    expect(JSON.stringify(prepareMonitoring('/media-info/probes',probeAttempts))).not.toContain('fixture-probe-secret');
    expect(prepareMonitoring('/media-info/live',{...mediaLive,jobs:[{...mediaLive.jobs[0],releaseKey:'unneeded-key'}]})).not.toHaveProperty('jobs.0.releaseKey');
    expect(prepareMonitoring('/media-info/files',{...mediaFiles,items:[{...mediaFiles.items[0],keys:['unneeded-key'],releaseKey:'unneeded-key'}]})).not.toHaveProperty('items.0.keys');
  });
});
