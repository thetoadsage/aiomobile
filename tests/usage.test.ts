import { describe, expect, it } from 'vitest';
import { validSnapshot } from '../src/api/client';
import { prepareMonitoring } from '../src/api/monitoring';
import { historyDuration, usageRatio } from '../src/lib/usage';
import { bandwidth, history, liveStreams, stats } from './fixtures';
import { addonAnalytics } from './usage-fixtures';
describe('historical usage and addon contracts', () => {
  it.each([['/streams/bandwidth?window=30d',bandwidth],['/streams/history', {entries:history,total:history.length}],['/usenet/stats?window=24h',stats],['/analytics/addons?range=24h',addonAnalytics]])('accepts supported %s snapshots', (path,data) => {
    expect(validSnapshot(path as string,data)).toBe(true);
  });
  it('rejects malformed newly rendered bandwidth and history values', () => {
    for (const data of [{...bandwidth,periodMode:'unknown'},{...bandwidth,bucketMs:0},{...bandwidth,byUser:[{...bandwidth.byUser[0],limit:NaN}]},{...bandwidth,seriesByUser:[{username:'alex',series:[{bucketMs:1,bytes:Infinity}]}]}]) expect(validSnapshot('/streams/bandwidth',data)).toBe(false);
    for (const row of [{...history[0],requests:'15'},{...history[0],lastSeenAt:NaN},{...history[0],endedAt:-1}]) expect(validSnapshot('/streams/history',{entries:[row],total:1})).toBe(false);
  });
  it('validates retained Usenet buckets, aggregates and historical provider state', () => {
    for (const data of [{...stats,totals:{...stats.totals,bytes:Infinity}},{...stats,throughput:[{...stats.throughput[0],errors:NaN}]},{...stats,providers:[{...stats.providers[0],removed:'yes'}]},{...stats,firstSeenAt:NaN}]) expect(validSnapshot('/usenet/stats',data)).toBe(false);
    expect(validSnapshot('/usenet/stats',{...stats,throughput:[]})).toBe(true);
    expect(validSnapshot('/usenet/stats',{...stats,throughput:[stats.throughput[0]]})).toBe(true);
  });
  it('accepts 0–100 addon percentages and rejects invalid latency/error fields', () => {
    for (const row of [{...addonAnalytics.addons[0],errorRate:101},{...addonAnalytics.addons[0],avgLatencyMs:Infinity},{...addonAnalytics.addons[0],errorKinds:{timeout:'4'}},{...addonAnalytics.addons[0],share:-1}]) expect(validSnapshot('/analytics/addons',{...addonAnalytics,addons:[row]})).toBe(false);
    expect(validSnapshot('/analytics/addons',{total:0,customEndpoints:0,addons:[]})).toBe(true);
  });
  it('drops unknown addon metadata and masks credential-shaped names and error kinds', () => {
    const data={...addonAnalytics,secret:'fixture-top-secret',addons:[{...addonAnalytics.addons[0],presetId:'https://user:password@example.test?api_key=fixture-key',url:'https://secret.example.test',errorKinds:{'token=fixture-secret':4}}]};
    const prepared=JSON.stringify(prepareMonitoring('/analytics/addons?range=24h',data));
    expect(prepared).toContain('<redacted>');
    for (const secret of ['fixture-top-secret','fixture-key','fixture-secret','password','secret.example.test']) expect(prepared).not.toContain(secret);
  });
  it('handles unlimited/over-limit usage and history without a recorded end truthfully', () => {
    expect(usageRatio(200,100)).toBe(2);expect(usageRatio(0,100)).toBe(0);expect(usageRatio(1,0)).toBeUndefined();expect(usageRatio(NaN,100)).toBeUndefined();
    expect(historyDuration({...history[0],startedAt:1000,endedAt:5000,lastSeenAt:4000})).toBe(4000);
    expect(historyDuration({...history[0],startedAt:1000,endedAt:undefined,lastSeenAt:4000})).toBe(3000);
    expect(historyDuration({...history[0],startedAt:5000,endedAt:undefined,lastSeenAt:4000})).toBeUndefined();
    for (const activeReads of [-1,Infinity,.5]) expect(validSnapshot('/streams/live',{...liveStreams,streams:[{...liveStreams.streams[0],activeReads}]})).toBe(false);
    for (const limit of [-1,Infinity,.5]) expect(validSnapshot('/streams/live',{...liveStreams,summary:{...liveStreams.summary,connectionLimit:limit}})).toBe(false);
  });
});
