import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
async function controlledLogs(page:Page) {
  await page.addInitScript(()=>{
    const Native=window.EventSource;
    type Feed={url:string;readyState:number;onopen:(()=>void)|null;onerror:(()=>void)|null;onmessage:((event:{data:string;lastEventId:string})=>void)|null};
    const feeds:Feed[]=[];
    class FixtureSource {
      static OPEN=1;static CONNECTING=0;static CLOSED=2;
      readyState=0;onopen:Feed['onopen']=null;onerror:Feed['onerror']=null;onmessage:Feed['onmessage']=null;
      constructor(public url:string){feeds.push(this);}
      close(){this.readyState=2;}
    }
    function Source(url:string,options?:EventSourceInit){return url.includes('/logs/stream') ? new FixtureSource(url) : new Native(url,options);}
    Object.assign(Source,{OPEN:1,CONNECTING:0,CLOSED:2});Object.defineProperty(window,'EventSource',{value:Source});
    Object.assign(window,{logFeeds:()=>feeds.map(f=>({url:f.url,readyState:f.readyState})),logEvent:(action:string,records:{seq:number;line:string}[])=>feeds.filter(f=>f.readyState!==2).forEach(f=>{
      if(action==='open'){f.readyState=1;f.onopen?.();}
      else if(action==='error'){f.readyState=0;f.onerror?.();}
      else records.forEach(row=>f.onmessage?.({data:row.line,lastEventId:String(row.seq)}));
    })});
  });
}
async function emit(page:Page,action='message',records:{seq:number;line:string}[]=[]) {
  await page.evaluate(({action,records})=>(window as unknown as {logEvent:(a:string,r:{seq:number;line:string}[])=>void}).logEvent(action,records),{action,records});
}
const record=(seq:number,message=`Synthetic live line ${seq}`)=>({seq,line:JSON.stringify({time:1760000000000+seq,level:'info',module:'usenet',msg:message,article:seq})});
const rows=(page:Page)=>page.locator('.log-row');
test.beforeEach(async({context})=>{await context.request.get('/fixture/login');});

test('snapshot, sequence deduplication, expand/copy and live appends',async({page})=>{
  await controlledLogs(page);await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);
  expect(await rows(page).first().getAttribute('data-seq')).toBe('1');expect(await rows(page).last().getAttribute('data-seq')).toBe('30');
  const feeds=await page.evaluate(()=>(window as unknown as {logFeeds:()=>{url:string}[]}).logFeeds());expect(new URL(feeds[0].url,locationUrl).searchParams.get('since')).toBe('30');
  await emit(page,'open');await expect(page.locator('.log-controls')).toContainText('Live');
  await emit(page,'message',[record(31),record(31),record(29)]);await expect(rows(page)).toHaveCount(31);
  await emit(page,'error');await expect(page.locator('.log-controls')).toContainText('Reconnecting');await emit(page,'open');await emit(page,'message',[record(31),record(32)]);await expect(rows(page)).toHaveCount(32);
  await page.locator('.log-list').evaluate(el=>{el.scrollTop=0;});await rows(page).first().getByRole('button').first().click();
  await expect(rows(page).first().locator('pre')).toContainText('<redacted>');expect(await rows(page).first().innerText()).not.toContain('fixture-only-secret');
  await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text:string)=>{Object.assign(window,{copiedLog:text});}},configurable:true});});
  await page.getByRole('button',{name:'Copy full entry',exact:true}).click();const copied=await page.evaluate(()=>(window as unknown as {copiedLog:string}).copiedLog);expect(copied).toContain('<redacted>');expect(copied).not.toMatch(/fixture-only-secret|fixture-key/);
});
const locationUrl=`http://127.0.0.1:${process.env.AIOMOBILE_TEST_PORT || 4174}`;

test('native EventSource sends Last-Event-ID, backfills and deduplicates replay',async({page,context})=>{
  await context.addCookies([{name:'fixture-log-reconnect',value:'1',url:locationUrl}]);
  await page.goto('/mobile/#logs');await expect(page.locator('.log-controls')).toContainText('Live');
  await expect.poll(async()=>{const response=await context.request.get('/fixture/log-connections');return (await response.json()).data;},{timeout:12000}).toContain(31);
  await expect(page.locator('.log-row[data-seq="32"]')).toHaveCount(1);await expect(page.locator('.log-row[data-seq="31"]')).toHaveCount(1);
  const seqs=await rows(page).evaluateAll(elements=>elements.map(el=>el.getAttribute('data-seq')));expect(new Set(seqs).size).toBe(seqs.length);
});

test('level/module multi-select and debounced text/regex search reset the feed',async({page})=>{
  await controlledLogs(page);await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);
  await page.getByRole('button',{name:'Log filters',exact:true}).click();let sheet=page.getByRole('dialog');
  await sheet.getByLabel('error',{exact:true}).check();await sheet.getByLabel('warn',{exact:true}).check();await sheet.getByLabel('nntp',{exact:true}).check();await sheet.getByLabel('indexer',{exact:true}).check();await sheet.getByRole('button',{name:'Apply filters'}).click();
  await expect(rows(page)).toHaveCount(10);await expect(page.locator('.log-level.error')).toHaveCount(5);await expect(page.locator('.log-level.warn')).toHaveCount(5);
  const activeFeeds=()=>page.evaluate(()=>(window as unknown as {logFeeds:()=>{url:string;readyState:number}[]}).logFeeds().filter(f=>f.readyState!==2));
  const url=new URL((await activeFeeds())[0].url,locationUrl);expect(url.searchParams.get('level')).toBe('error,warn');expect(url.searchParams.get('module')).toBe('indexer,nntp');
  let searches=0;page.on('request',r=>{if(r.url().includes('/logs?') && new URL(r.url()).searchParams.has('q'))searches++;});
  await page.getByRole('searchbox',{name:'Search logs'}).pressSequentially('timed',{delay:30});await expect(rows(page)).toHaveCount(5);expect(searches).toBe(1);
  await page.getByRole('button',{name:/Log filters/}).click();sheet=page.getByRole('dialog');await sheet.getByText('Advanced search',{exact:true}).click();await sheet.getByLabel('Regular expression').check();await sheet.getByRole('button',{name:'Apply filters'}).click();
  await page.getByRole('searchbox').fill('timed|selected');await expect(rows(page)).toHaveCount(10);
  expect(new URL((await activeFeeds())[0].url,locationUrl).searchParams.get('regex')).toBe('true');
  await page.getByRole('searchbox').fill('[');await expect(page.getByRole('alert')).toContainText('Invalid regular expression');expect(await activeFeeds()).toHaveLength(0);
});

test('pause buffers updates, scrolling up counts new logs, Latest resumes following',async({page})=>{
  await controlledLogs(page);await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);await emit(page,'open');
  await page.getByRole('button',{name:'Pause',exact:true}).click();await emit(page,'message',[record(31),record(32)]);await expect(rows(page)).toHaveCount(30);await expect(page.getByRole('button',{name:/2 new logs/})).toBeVisible();
  await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(rows(page)).toHaveCount(32);
  await page.locator('.log-list').evaluate(el=>{el.scrollTop=0;});await emit(page,'message',[record(33),record(34)]);await expect(rows(page)).toHaveCount(34);
  await expect(page.getByRole('button',{name:/2 new logs/})).toBeVisible();expect(await page.locator('.log-list').evaluate(el=>el.scrollTop)).toBe(0);
  await page.getByRole('button',{name:/2 new logs/}).click();await expect(page.getByRole('button',{name:/new logs/})).toHaveCount(0);
  expect(await page.locator('.log-list').evaluate(el=>el.scrollHeight-el.scrollTop-el.clientHeight)).toBeLessThan(2);
});

test('noisy feeds cap visible and paused buffers and clean up when leaving Logs',async({page})=>{
  await controlledLogs(page);await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);await emit(page,'open');
  await emit(page,'message',Array.from({length:1300},(_,i)=>record(31+i)));await expect(rows(page)).toHaveCount(1000);expect(await rows(page).first().getAttribute('data-seq')).toBe('331');
  await page.locator('.log-list').evaluate(el=>{el.scrollTop=el.scrollHeight*.4;});
  await page.waitForTimeout(50);const position=await page.locator('.log-list').evaluate(el=>{const top=el.getBoundingClientRect().top;const entry=[...el.querySelectorAll<HTMLElement>('[data-seq]')].find(row=>row.getBoundingClientRect().bottom>top+1)!;return {seq:entry.dataset.seq!,y:entry.getBoundingClientRect().top};});
  await emit(page,'message',Array.from({length:100},(_,i)=>record(1331+i)));await expect(rows(page).last()).toHaveAttribute('data-seq','1430');
  expect(Math.abs((await page.locator(`[data-seq="${position.seq}"]`).boundingBox())!.y-position.y)).toBeLessThan(2);
  await page.getByRole('button',{name:'Pause',exact:true}).click();await emit(page,'message',Array.from({length:1200},(_,i)=>record(1431+i)));await expect(rows(page)).toHaveCount(1000);await expect(page.getByRole('button',{name:/1000 new logs/})).toBeVisible();
  await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(rows(page)).toHaveCount(1000);expect(await rows(page).last().getAttribute('data-seq')).toBe('2630');
  await page.getByRole('link',{name:'More',exact:true}).click();await expect(page.getByRole('heading',{name:'More',exact:true})).toBeVisible();const feeds=await page.evaluate(()=>(window as unknown as {logFeeds:()=>{readyState:number}[]}).logFeeds());expect(feeds.every(f=>f.readyState===2)).toBe(true);
  await page.getByRole('button',{name:/History & Bandwidth/}).click();await expect(page.getByRole('heading',{name:'History & bandwidth',exact:false})).toBeVisible();
});

test('clear requires confirmation, sends JSON and keeps the existing live feed',async({page})=>{
  await controlledLogs(page);let clears=0;
  page.on('request',r=>{if(r.url().endsWith('/logs/clear')){clears++;expect(r.method()).toBe('POST');expect(r.postDataJSON()).toEqual({confirm:true});}});
  await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);await emit(page,'open');
  await page.getByRole('button',{name:'Log actions',exact:true}).click();await page.getByRole('button',{name:'Clear retained logs…',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('in-memory retained buffer');expect(clears).toBe(0);
  await page.getByRole('button',{name:'Keep logs'}).click();expect(clears).toBe(0);
  await page.getByRole('button',{name:'Log actions',exact:true}).click();await page.getByRole('button',{name:'Clear retained logs…',exact:true}).click();await page.getByRole('button',{name:'Clear retained logs',exact:true}).click();
  await expect(rows(page)).toHaveCount(0);expect(clears).toBe(1);await emit(page,'message',[record(31,'New line after clear')]);await expect(rows(page)).toHaveCount(1);
  expect((await page.evaluate(()=>(window as unknown as {logFeeds:()=>unknown[]}).logFeeds())).length).toBe(1);
});

test('filtered export uses upstream route and masks the downloaded NDJSON',async({page})=>{
  await controlledLogs(page);await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);await page.getByRole('searchbox').fill('Example.Movie');await expect(rows(page)).toHaveCount(1);
  let exportUrl='';page.on('request',r=>{if(r.url().includes('/logs/export'))exportUrl=r.url();});
  for(const label of ['Export plain log','Export JSON / NDJSON']){
    await page.getByRole('button',{name:'Log actions',exact:true}).click();const promise=page.waitForEvent('download');await page.getByRole('button',{name:label,exact:true}).click();const download=await promise;
    const stream=await download.createReadStream();let text='';for await(const chunk of stream!)text+=chunk.toString();expect(text).toContain('<redacted>');expect(text).not.toMatch(/fixture-only-secret|fixture-key/);
    expect(new URL(exportUrl).searchParams.get('q')).toBe('Example.Movie');expect(new URL(exportUrl).searchParams.get('format')).toBe(label==='Export plain log' ? 'log' : 'json');
  }
});

for(const status of [401,403])test(`auth ${status} closes SSE and suspends log retries`,async({page})=>{
  await page.clock.install();await controlledLogs(page);let expired=false,calls=0;
  await page.route('**/dashboard/logs?*',async route=>{calls++;if(expired)await route.fulfill({status,json:{success:false}});else await route.continue();});
  await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);await emit(page,'open');expired=true;
  await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(page.getByRole('link',{name:'Sign in',exact:true})).toBeVisible();
  const before=calls;await page.clock.fastForward(180000);expect(calls).toBe(before);expect((await page.evaluate(()=>(window as unknown as {logFeeds:()=>{readyState:number}[]}).logFeeds())).every(f=>f.readyState===2)).toBe(true);
});

test('quiet OPEN SSE never falls back; failed reconnection polls at most every 30s and recovers',async({page})=>{
  await page.clock.install();await controlledLogs(page);let calls=0;page.on('request',r=>{if(r.url().includes('/dashboard/logs?'))calls++;});
  await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);await emit(page,'open');const initial=calls;await page.clock.fastForward(180000);expect(calls).toBe(initial);
  await emit(page,'error');await page.clock.fastForward(35000);await expect(page.locator('.log-fallback')).toContainText('REST fallback');
  const fallbackCalls=calls;await page.clock.fastForward(90000);expect(calls-fallbackCalls).toBeLessThanOrEqual(3);
  await emit(page,'open');await emit(page,'message',[record(31)]);await expect(rows(page)).toHaveCount(31);await expect(page.locator('.log-fallback')).toHaveCount(0);
});

test('a delayed REST refresh cannot reset a newer live sequence or resurrect cleared lines',async({page})=>{
  await controlledLogs(page);await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);await emit(page,'open');
  let release:()=>void=()=>{};let waiting=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/dashboard/logs?*',async route=>{await waiting;await route.fulfill({json:{success:true,data:{logs:[],nextSeq:30,bufferStats:{entries:30,bytes:4096,maxBytes:1048576,maxEntries:5000,lastSeq:30}}}});});
  await page.getByRole('button',{name:'Refresh dashboard'}).click();await emit(page,'message',[record(31)]);await expect(rows(page)).toHaveCount(31);release();
  await page.waitForResponse(r=>r.url().includes('/dashboard/logs?'));await expect(rows(page)).toHaveCount(31);expect(await rows(page).last().getAttribute('data-seq')).toBe('31');
  waiting=new Promise<void>(resolve=>{release=resolve;});await page.getByRole('button',{name:'Refresh dashboard'}).click();
  await page.getByRole('button',{name:'Log actions',exact:true}).click();await page.getByRole('button',{name:'Clear retained logs…',exact:true}).click();await page.getByRole('button',{name:'Clear retained logs',exact:true}).click();await expect(rows(page)).toHaveCount(0);release();await emit(page,'message',[record(32)]);await expect(rows(page)).toHaveCount(1);
});

test('clear failure preserves rows and the confirmation can be retried',async({page})=>{
  await controlledLogs(page);await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);let failed=true;
  await page.route('**/logs/clear',route=>failed ? route.fulfill({status:503,json:{success:false,error:{message:'Temporary fixture failure'}}}) : route.continue());
  await page.getByRole('button',{name:'Log actions',exact:true}).click();await page.getByRole('button',{name:'Clear retained logs…',exact:true}).click();await page.getByRole('button',{name:'Clear retained logs',exact:true}).click();await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Temporary fixture failure');await expect(rows(page)).toHaveCount(30);
  failed=false;await page.getByRole('button',{name:'Clear retained logs',exact:true}).click();await expect(rows(page)).toHaveCount(0);await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('hidden/offline suspends traffic and restores a cursor; search fits the keyboard viewport',async({page})=>{
  await page.clock.install();await controlledLogs(page);await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);await emit(page,'open');let calls=0;
  page.on('request',r=>{if(r.url().includes('/dashboard/logs'))calls++;});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});const before=calls;await page.clock.fastForward(120000);expect(calls).toBe(before);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await emit(page,'open');
  await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});window.dispatchEvent(new Event('offline'));});await expect(page.locator('.log-controls')).toContainText('Offline');const offlineCalls=calls;await page.clock.fastForward(120000);expect(calls).toBe(offlineCalls);
  await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>true});window.dispatchEvent(new Event('online'));});await emit(page,'open');await expect(rows(page)).toHaveCount(30);
  await page.evaluate(()=>{Object.defineProperty(window.visualViewport,'height',{configurable:true,value:500});window.visualViewport?.dispatchEvent(new Event('resize'));});
  await expect.poll(()=>page.locator('.logs-layout').evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(500);
});

test('mobile layout wraps long entries, supports landscape and captures iPhone screenshots',async({page},testInfo)=>{
  await page.setViewportSize({width:390,height:844});await controlledLogs(page);await page.goto('/mobile/#logs');await expect(rows(page)).toHaveCount(30);await emit(page,'open');
  if(testInfo.project.name==='chromium'){await mkdir('docs/screenshots',{recursive:true});await page.screenshot({path:'docs/screenshots/logs.png'});}
  await emit(page,'message',[record(31,'Long technical path '+ 'abcdefghij/'.repeat(60))]);await expect(rows(page)).toHaveCount(31);await rows(page).last().getByRole('button').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.getByRole('searchbox').evaluate(el=>getComputedStyle(el).fontSize)).toBe('16px');
  await page.setViewportSize({width:844,height:390});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect.poll(()=>page.locator('.bottom-nav').evaluate(el=>Math.abs(el.getBoundingClientRect().bottom-innerHeight))).toBeLessThan(1);
  await page.setViewportSize({width:390,height:844});
  if(testInfo.project.name==='chromium'){
    await mkdir('docs/screenshots',{recursive:true});await page.screenshot({path:'docs/screenshots/logs-long-entry.png'});
    await page.getByRole('button',{name:/Log filters/}).click();await page.screenshot({path:'docs/screenshots/logs-filters.png'});await page.getByRole('button',{name:'Close sheet'}).click();
    await page.getByRole('button',{name:'Log actions',exact:true}).click();await page.getByRole('button',{name:'Clear retained logs…',exact:true}).click();await page.screenshot({path:'docs/screenshots/logs-clear.png'});
  }
});
