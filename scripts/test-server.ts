// Local integration-test fixtures only. Not a runtime backend or deployment target.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { liveStreams, liveUsenet, bandwidth, stats, history, logRecords } from '../tests/fixtures.ts';
import { addonAnalytics } from '../tests/usage-fixtures.ts';
import { systemMetrics, tasksSnapshot, librarySnapshot, mediaSummary, mediaLive, probeAttempts, mediaFiles } from '../tests/monitoring-fixtures.ts';
const fixturePort=Number(process.env.AIOMOBILE_TEST_PORT || 4174);
let unavailable=false;
let logs=[...logRecords],logSeq=30,logReconnect=false;
const logConnections:number[]=[];
function filteredLogs(url:URL) {
  const q=url.searchParams.get('q');let expression:RegExp | undefined;try{if(q && url.searchParams.get('regex')==='true')expression=new RegExp(q,'i');}catch{return [];}
  return logs.filter(row=>(!url.searchParams.has('since') || row.seq>Number(url.searchParams.get('since'))) && (!url.searchParams.has('until') || row.ts<=Number(url.searchParams.get('until'))) && (!url.searchParams.get('level') || url.searchParams.get('level')!.split(',').includes(row.level)) && (!url.searchParams.get('module') || url.searchParams.get('module')!.split(',').includes(row.module)) && (!q || (expression ? expression.test(row.line) : row.line.toLowerCase().includes(q.toLowerCase()))));
}

const sessions=new Set<string>(liveStreams.streams.map(s=>s.id));
const server=createServer(async(req,res)=> {
  const url=new URL(req.url || '/', 'http://127.0.0.1:4174');
  const json=(data:unknown,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(status===200 ? {success:true,data} : {success:false,error:{message:'Test unauthorized'}}));};
  if(url.pathname==='/fixture/online'){unavailable=false;json({ok:true});return;}
  if(url.pathname==='/fixture/offline'){unavailable=true;json({ok:true});return;}
  if(unavailable){req.socket.destroy();return;}
  if(url.pathname==='/login'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><html><body><h1>AIOMobile test fixtures</h1><p>Synthetic data only. No real AIOStreams instance.</p><form method="post" action="/fixture/login"><button>Start fixture session</button></form></body></html>');return;}
  if(url.pathname==='/fixture/login' && req.method==='POST'){res.writeHead(303,{'Set-Cookie':'aiostreams.session=fixture-admin; Path=/; HttpOnly; SameSite=Strict',Location:'/mobile/'});res.end();return;}
  if(url.pathname==='/fixture/log-connections'){json(logConnections);return;}
  if(url.pathname==='/fixture/login'){logs=[...logRecords];logSeq=30;logConnections.length=0;logReconnect=false;res.setHeader('Set-Cookie','aiostreams.session=fixture-admin; Path=/; HttpOnly; SameSite=Strict');json({ok:true});return;}
  if(url.pathname.startsWith('/api/')){
    if(!req.headers.cookie?.includes('aiostreams.session=fixture-admin')){json(null,401);return;}
    if(url.pathname==='/api/v1/dashboard/logs/stream'){
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});res.flushHeaders();
      const last=Number(req.headers['last-event-id'] || url.searchParams.get('since') || 0);logConnections.push(Number(req.headers['last-event-id'] || 0));
      url.searchParams.set('since',String(last));const send=(row:typeof logRecords[number])=>res.write(`id: ${row.seq}\ndata: ${row.line}\n\n`);
      // Duplicate replay deliberately tests idempotence on the native EventSource path.
      if(last && req.headers['last-event-id']){const prior=logs.find(row=>row.seq===last);if(prior)send(prior);}
      filteredLogs(url).forEach(send);
      const timer=setInterval(()=>{
        const seq=++logSeq;const row={seq,ts:Date.now(),level:'info',module:'usenet',line:JSON.stringify({time:Date.now(),level:'info',module:'usenet',msg:`Live article batch ${seq}`,articles:16})};logs.push(row);
        if(filteredLogs(url).some(value=>value.seq===seq))send(row);else res.write(':hb\n\n');
        if(req.headers.cookie?.includes('fixture-log-reconnect=1') && !logReconnect){logReconnect=true;res.end();}
      },900);req.on('close',()=>clearInterval(timer));return;
    }
    if(url.pathname==='/api/v1/dashboard/logs/export'){res.writeHead(200,{'Content-Type':url.searchParams.get('format')==='json' ? 'application/x-ndjson' : 'text/plain','Content-Disposition':'attachment; filename="fixture.log"'});res.end(filteredLogs(url).map(row=>row.line).join('\n')+'\n');return;}
    if(url.pathname==='/api/v1/dashboard/logs/clear' && req.method==='POST'){let body='';for await(const chunk of req)body+=chunk;if(JSON.parse(body).confirm!==true){json(null,400);return;}logs=[];json({cleared:true});return;}
    if(url.pathname==='/api/v1/dashboard/logs'){const entries=filteredLogs(url).slice(-Number(url.searchParams.get('limit') || 200));json({logs:url.searchParams.get('order')==='asc' ? entries : entries.reverse(),nextSeq:logSeq,bufferStats:{entries:logs.length,bytes:logs.reduce((n,row)=>n+row.line.length,0),maxBytes:1048576,maxEntries:5000,lastSeq:logSeq}});return;}
    if(url.pathname==='/api/v1/dashboard/system/stream' || url.pathname==='/api/v1/dashboard/media-info/live/stream'){
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});res.flushHeaders();
      const send=()=>res.write(`data: ${JSON.stringify(url.pathname.includes('/system/') ? systemMetrics : mediaLive)}\n\n`);
      send();const timer=setInterval(send,5000);req.on('close',()=>clearInterval(timer));return;
    }
    if(url.pathname==='/api/v1/dashboard/analytics/addons'){json(addonAnalytics);return;}
    if(url.pathname==='/api/v1/dashboard/system'){json(systemMetrics);return;}
    if(url.pathname==='/api/v1/dashboard/tasks'){json(tasksSnapshot);return;}
    if(url.pathname==='/api/v1/dashboard/usenet/library'){
      const q=(url.searchParams.get('q') || '').toLowerCase();const statuses=(url.searchParams.get('statuses') || '').split(',').filter(Boolean);
      const rows=librarySnapshot.entries.filter(r=>(!q || (r.name || '').toLowerCase().includes(q)) && (!statuses.length || statuses.includes(r.status)));
      const offset=Number(url.searchParams.get('offset') || 0);json({total:rows.length,entries:rows.slice(offset,offset+20)});return;
    }
    if(url.pathname==='/api/v1/dashboard/media-info'){json(mediaSummary);return;}
    if(url.pathname==='/api/v1/dashboard/media-info/live'){json(mediaLive);return;}
    if(url.pathname==='/api/v1/dashboard/media-info/probes' || url.pathname==='/api/v1/dashboard/media-info/files'){
      const q=(url.searchParams.get('q') || '').toLowerCase();const outcome=url.searchParams.get('outcome');const offset=Number(url.searchParams.get('offset') || 0);
      if(url.pathname.endsWith('/probes')){const rows=probeAttempts.items.filter(r=>r.file.toLowerCase().includes(q) && (!outcome || r.outcome===outcome));json({total:rows.length,capped:false,items:rows.slice(offset,offset+20)});}
      else {const rows=mediaFiles.items.filter(r=>r.file.toLowerCase().includes(q));json({total:rows.length,capped:false,items:rows.slice(offset,offset+20)});}return;
    }
    const snapshot=()=>({...liveStreams,streams:liveStreams.streams.filter(s=>sessions.has(s.id))});
    if(url.pathname.endsWith('/live/stream')){
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});
      const stream=url.pathname.includes('/streams/');
      let tick=0;
      const quiet=req.headers.cookie?.includes('fixture-quiet=1');let sentSnapshot=false;
      const send=()=>{if(quiet && sentSnapshot){res.write(':hb\n\n');return;}sentSnapshot=true;const data=stream ? snapshot() : liveUsenet;res.write(`data: ${JSON.stringify({...data,tickMs:1500,...(stream ? {summary:{...liveStreams.summary,totalBytesPerSec:liveStreams.summary.totalBytesPerSec+(tick++%4)*1024**2}} : {})})}\n\n`);};
      send();const timer=setInterval(send,1500);req.on('close',()=>clearInterval(timer));return;
    }
    if(url.pathname.endsWith('/streams/live')){json(snapshot());return;}
    if(url.pathname.endsWith('/usenet/live')){json(liveUsenet);return;}
    if(url.pathname.endsWith('/bandwidth')){json({...bandwidth,window:url.searchParams.get('window') || '30d'});return;}
    if(url.pathname.endsWith('/stats')){json({...stats,window:url.searchParams.get('window') || '24h'});return;}
    if(url.pathname.endsWith('/history')){
      const q=url.searchParams.get('q')?.toLowerCase() || '';const username=url.searchParams.get('username');const transport=url.searchParams.get('transport');
      const rows=history.filter(s=>(s.filename || '').toLowerCase().includes(q) && (!username || s.username===username) && (!transport || s.transport===transport));
      const offset=Number(url.searchParams.get('offset')||0);const limit=Number(url.searchParams.get('limit')||20);json({entries:rows.slice(offset,offset+limit),total:rows.length});return;
    }
    if(req.method==='DELETE' && url.pathname.includes('/sessions/')){const id=decodeURIComponent(url.pathname.split('/').at(-1)!);sessions.delete(id);json({stopped:true});return;}
    json(null,404);return;
  }
  try {
    const path=resolve('dist',url.pathname.replace(/^\/mobile\/?/, '') || 'index.html');
    if(!path.startsWith(resolve('dist')+'/')){res.writeHead(404);res.end();return;}
    const file=(await stat(path)).isDirectory() ? resolve(path,'index.html') : path;
    const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
    res.writeHead(200,{'Content-Type':mime[extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(fixturePort,'127.0.0.1',()=>console.log(`AIOMobile fixture test server: http://127.0.0.1:${fixturePort}/mobile/ (synthetic data only)`));
