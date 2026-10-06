import type { BandwidthOverview, LiveStats, LiveStreams, StreamHistoryRow, UsenetStatsOverview } from '../src/api/types.ts';
const now=1791043200000;
export const liveStreams:LiveStreams = {
  streams:[{id:'stream-1',transport:'usenet',username:'alex',clientIp:'192.0.2.10',targetKey:'test-target',filename:'The.Expanse.S01E01.2160p.mkv',size:12*1024**3,bytesServed:4*1024**3,requests:12,startedAt:now-3600000,lastSeenAt:now,activeReads:2,activity:'streaming',idleMs:0,start:0,currentBytes:3*1024**3,bytesPerSec:12*1024**2,instanceId:'test-instance'},
  {id:'stream-2',transport:'proxy',username:'sam',targetKey:'test-target-2',filename:'Planet.Earth.II.1080p.mkv',size:4*1024**3,bytesServed:1024**3,requests:4,startedAt:now-600000,lastSeenAt:now,activeReads:1,activity:'paused',idleMs:3000,start:0,currentBytes:1024**3,bytesPerSec:0,instanceId:'test-instance'}],
  summary:{streaming:1,paused:1,idle:0,totalBytesPerSec:12*1024**2,connectionLimit:8},tickMs:1500,
};
export const liveUsenet:LiveStats = {
  live:{activeStreams:1,currentBytesPerSec:14*1024**2,peakBytesPerSec:32*1024**2,articlesLastMinute:4520,errorsLastMinute:0,bytesLastMinute:810*1024**2},
  pool:{providers:[{id:'p1',name:'Primary provider',state:'online',total:8,idle:2,acquired:6,available:2,max:12,tripped:false,throttled:false,isBackup:false,freeSlots:4,throughput:14*1024**2,queued:0}],globalDownloadsInUse:6,globalDownloadMax:12,globalDownloadsOnWire:6,globalDownloadsWaiting:0},
  cache:{hits:50,misses:10,hitRate:.833,diskBytes:0,diskCount:0,diskHits:0},streams:[],tickMs:1500,
};
export const bandwidth:BandwidthOverview = {
  window:'30d',generatedAt:now,sinceMs:now-30*86400000,bucketMs:86400000,periodStart:now-30*86400000,periodMode:'rolling',total:780*1024**3,byTransport:{usenet:600*1024**3,proxy:180*1024**3},byUser:[{username:'alex',bytes:600*1024**3,limit:1024**4,connectionLimit:4},{username:'sam',bytes:180*1024**3,limit:0,connectionLimit:0}],
  series:Array.from({length:24},(_,i)=>({bucketMs:now-(23-i)*3600000,bytes:(4+[2,5,4,9,3,7,16,8][i%8])*1024**3})),seriesByUser:[{username:'alex',series:Array.from({length:4},(_,i)=>({bucketMs:now-(3-i)*3600000,bytes:(i+1)*1024**3}))},{username:'sam',series:Array.from({length:4},(_,i)=>({bucketMs:now-(3-i)*3600000,bytes:(4-i)*1024**3}))}],globalLimit:2*1024**4,periodTotal:780*1024**3,
};
export const stats:UsenetStatsOverview = {
  window:'24h',generatedAt:now,bucketMs:3600000,live:liveUsenet.live,pool:liveUsenet.pool,cache:liveUsenet.cache,
  totals:{articles:120000,bytes:70*1024**3,errors:10,missing:20,undecodable:0,avgLatencyMs:32,avgArticleMs:48,avgBytesPerSec:14*1024**2},
  providers:[{id:'p1',name:'Primary provider',host:'news.example.test',enabled:true,isBackup:false,priority:1,live:{state:'online',active:6,idle:2,total:8,max:12,available:2,tripped:false},articles:120000,bytes:70*1024**3,errors:10,missing:20,undecodable:0,avgLatencyMs:32,avgArticleMs:48,avgBytesPerSec:14*1024**2,errorRate:.00008,missRate:.00016,undecodableRate:0,articleShare:1,removed:false}],
  indexers:[{indexer:'Test indexer',grabs:100,ok:95,degraded:3,failed:2,failedMissing:1,failedFetch:1,fetchAuth:0,fetchLimited:0,successRate:.98,grabShare:1,avgGrabMs:320,avgImportMs:800,lastError:{message:'Test missing article',atMs:now}}],throughput:Array.from({length:4},(_,i)=>({bucketMs:now-(3-i)*3600000,articles:30000,bytes:(10+i*5)*1024**3,errors:[1,2,3,4][i],missing:5,undecodable:0,avgLatencyMs:32,avgBytesPerSec:14*1024**2})),firstSeenAt:now-30*86400000,
};
export const history:StreamHistoryRow[] = Array.from({length:25},(_,i)=>({id:`history-${i}`,transport:i%2 ? 'proxy' : 'usenet',username:i%2 ? 'sam' : 'alex',targetKey:`target-${i}`,filename:`Episode.${i+1}.mkv`,size:4*1024**3,bytesServed:4*1024**3,requests:15,startedAt:now-i*3600000,endedAt:now,lastSeenAt:now,endReason:'idle',instanceId:'test-instance'}));

// Synthetic records only; intentionally secret-shaped values exercise client masking.
export const logRecords = Array.from({length:30},(_,i)=>{
  const level=['info','warn','error','debug','trace','fatal'][i%6];const module=['usenet','indexer','nntp'][i%3];
  const ts=Date.parse('2026-10-03T20:00:00Z')+i*1000;
  return {seq:i+1,ts,level,module,line:JSON.stringify({time:ts,level,module,msg:i===0 ? 'Stream opened for Example.Movie.2026.1080p.mkv' : `${module}: ${['Article fetched successfully','Backup provider selected','Article fetch timed out','Connection returned to pool','Checking article headers','Fetch terminated'][i%6]}`,details:{attempt:i+1,...(i===0 ? {authorization:'Bearer fixture-only-secret',url:'https://example.invalid/?api_key=fixture-key'} : {})}})};
});
