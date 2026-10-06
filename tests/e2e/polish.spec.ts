import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { liveStreams, liveUsenet, stats } from '../fixtures';

async function controlledFeeds(page:Page) {
  await page.addInitScript(()=>{
    type Feed={url:string;readyState:number;onmessage:((event:{data:string})=>void)|null;onerror:(()=>void)|null;close:()=>void};
    const feeds:Feed[]=[];
    class FixtureSource {
      static OPEN=1;static CONNECTING=0;static CLOSED=2;
      readyState=0;onmessage:Feed['onmessage']=null;onerror:Feed['onerror']=null;
      constructor(public url:string){feeds.push(this);}
      close(){this.readyState=2;}
    }
    Object.defineProperty(window,'EventSource',{value:FixtureSource});
    Object.assign(window,{emitFixture:(channel:string,data:unknown)=>{
      feeds.filter(f=>f.url.includes(channel) && f.readyState!==2).forEach(f=>{f.readyState=1;f.onmessage?.({data:JSON.stringify(data)});});
    },fixtureFeedCounts:()=>({created:feeds.length,open:feeds.filter(f=>f.readyState!==2).length}),failFixture:(channel:string)=>feeds.filter(f=>f.url.includes(channel) && f.readyState!==2).forEach(f=>f.onerror?.())});
  });
}
async function emit(page:Page,channel:string,data:unknown){await page.evaluate(({channel,data})=>(window as unknown as {emitFixture:(channel:string,data:unknown)=>void}).emitFixture(channel,data),{channel,data});}
async function fail(page:Page,channel:string){await page.evaluate(channel=>(window as unknown as {failFixture:(channel:string)=>void}).failFixture(channel),channel);}
test.beforeEach(async({context})=>{await context.request.get('/fixture/login');});

test('live states, retained refresh data, stale fallback and recovery',async({page})=>{
  await page.clock.install();await controlledFeeds(page);
  let failing=false;
  await page.route('**/streams/live',route=>failing ? route.fulfill({status:503,json:{success:false,error:{message:'Fixture unavailable'}}}) : route.fulfill({json:{success:true,data:liveStreams}}));
  await page.goto('/mobile/#streams');await expect(page.locator('.stream-card')).toHaveCount(2);
  await emit(page,'/streams/',liveStreams);await emit(page,'/usenet/',liveUsenet);
  const card=page.getByRole('button',{name:/The.Expanse/});await expect(card.locator('.badge.streaming')).toBeVisible();
  for(const activity of ['paused','idle','streaming'] as const){await emit(page,'/streams/',{...liveStreams,streams:[{...liveStreams.streams[0],activity,bytesPerSec:activity==='streaming' ? 1024**2 : 0},liveStreams.streams[1]]});await expect(card.locator(`.badge.${activity}`)).toBeVisible();}
  await Promise.all([page.waitForResponse(r=>r.url().endsWith('/streams/live')),page.getByRole('button',{name:'Refresh dashboard'}).click()]);await expect(page.getByText('Refreshing…')).toHaveCount(0);await expect(page.locator('.skeletons')).toHaveCount(0);await expect(card).toBeVisible();
  failing=true;await fail(page,'/streams/');await expect(page.getByText('Updates unavailable')).toBeVisible();await expect(card).toBeVisible();await fail(page,'/usenet/');
  await page.clock.fastForward(10000);await expect(page.getByText(/Updated 10s ago/)).toBeVisible();
  failing=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByText('Updates unavailable')).toHaveCount(0);await expect(page.getByText('REST fallback',{exact:true})).toBeVisible();
  await page.clock.fastForward(60000);await emit(page,'/streams/',{...liveStreams,streams:[]});await emit(page,'/usenet/',liveUsenet);
  await expect(page.getByText('Live',{exact:true})).toBeVisible();await expect(page.locator('.stream-card')).toHaveCount(0);await expect(page.getByText('No active streams')).toBeVisible();
});

test('a delayed REST seed cannot replace a newer live frame or its health',async({page})=>{
  await controlledFeeds(page);
  let finish:()=>void=()=>{};const released=new Promise<void>(resolve=>{finish=resolve;});
  await page.route('**/streams/live',async route=>{await released;await route.fulfill({status:503,json:{success:false,error:{message:'Old seed failed'}}});});
  await page.goto('/mobile/#streams');
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {fixtureFeedCounts:()=>{created:number}}).fixtureFeedCounts().created)).toBe(2);
  await emit(page,'/streams/',liveStreams);await emit(page,'/usenet/',liveUsenet);await expect(page.getByText('Live',{exact:true})).toBeVisible();
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/streams/live'));finish();await (await responsePromise).finished();await expect(page.locator('.stream-card')).toHaveCount(2);await expect(page.getByText('Refreshing…')).toHaveCount(0);
  await expect(page.getByText('Updates unavailable')).toHaveCount(0);await expect(page.getByText('Live',{exact:true})).toBeVisible();
});

test('expired authentication closes a live feed and suspends retries',async({page})=>{
  await page.clock.install();await controlledFeeds(page);let unauthorized=false,calls=0;
  await page.route('**/streams/live',route=>{calls++;return unauthorized ? route.fulfill({status:401,json:{success:false}}) : route.fulfill({json:{success:true,data:liveStreams}});});
  await page.goto('/mobile/#streams');await expect(page.locator('.stream-card')).toHaveCount(2);
  await emit(page,'/streams/',liveStreams);await emit(page,'/usenet/',liveUsenet);unauthorized=true;
  await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(page.getByText('Authentication expired')).toBeVisible();
  await expect(page.getByRole('link',{name:'Sign in',exact:true})).toBeVisible();await expect(page.locator('.stream-card')).toHaveCount(2);
  const before=calls;await page.clock.fastForward(120000);expect(calls).toBe(before);
});

test('change-only OPEN SSE stays live during a quiet period without REST polling',async({page})=>{
  await page.clock.install();await controlledFeeds(page);await page.goto('/mobile/#streams');await expect(page.locator('.stream-card')).toHaveCount(2);
  await emit(page,'/streams/',liveStreams);await emit(page,'/usenet/',liveUsenet);
  const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
  await page.clock.fastForward(180000);await expect(page.getByText('Live',{exact:true})).toBeVisible();await expect(page.locator('.stream-card')).toHaveCount(2);expect(requests.filter(url=>url.includes('/streams/live'))).toEqual([]);
});

test('native EventSource remains live with heartbeat comments and unchanged snapshots',async({page,context})=>{
  await context.addCookies([{name:'fixture-quiet',value:'1',url:`http://127.0.0.1:${process.env.AIOMOBILE_TEST_PORT || 4174}`}]);
  await page.clock.install();await page.goto('/mobile/#streams');await expect(page.getByText('Live',{exact:true})).toBeVisible();
  let liveRequests=0;page.on('request',r=>{if(r.url().includes('/live'))liveRequests++;});
  await page.clock.fastForward(180000);await expect(page.getByText('Live',{exact:true})).toBeVisible();expect(liveRequests).toBe(0);
});

test('navigation retains stream feeds, closes the Overview System feed, and suspends hidden/offline traffic',async({page})=>{
  await page.clock.install();await controlledFeeds(page);let calls=0;
  page.on('request',r=>{if(r.url().includes('/api/'))calls++;});
  await page.goto('/mobile/');await expect(page.locator('.stream-card')).toHaveCount(2);
  const feeds=()=>page.evaluate(()=>(window as unknown as {fixtureFeedCounts:()=>{created:number;open:number}}).fixtureFeedCounts());
  await expect.poll(feeds).toEqual({created:3,open:3});
  await page.getByRole('link',{name:'Streams',exact:true}).click();await page.getByRole('button',{name:/The.Expanse/}).click();
  await page.goto('/mobile/#settings');await expect.poll(feeds).toEqual({created:3,open:2});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  expect((await feeds()).open).toBe(0);const hiddenCalls=calls;await page.clock.fastForward(120000);expect(calls).toBe(hiddenCalls);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(feeds).toEqual({created:5,open:2});
  await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>false});window.dispatchEvent(new Event('offline'));});
  await expect(page.getByText('Offline',{exact:true})).toBeVisible();expect((await feeds()).open).toBe(0);
  const offlineCalls=calls;await page.clock.fastForward(120000);expect(calls).toBe(offlineCalls);
  await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>true});window.dispatchEvent(new Event('online'));});
  await expect.poll(feeds).toEqual({created:7,open:2});
});

test('incompatible live frames preserve snapshots and report safe diagnostics',async({page})=>{
  await controlledFeeds(page);await page.goto('/mobile/#streams');await expect(page.locator('.stream-card')).toHaveCount(2);
  await emit(page,'/streams/',liveStreams);await emit(page,'/streams/',{secret:'https://user:token@fixture.invalid',streams:[{}]});
  await expect(page.getByText('REST fallback',{exact:true})).toBeVisible();await expect(page.locator('.stream-card')).toHaveCount(2);
  await page.goto('/mobile/#settings');await page.getByRole('button',{name:'Show diagnostics'}).click();await expect(page.getByText('Streams · Live frame rejected')).toBeVisible();
  expect(await page.locator('.diagnostics').innerText()).not.toMatch(/token|fixture.invalid|secret/);
});

test('provider states distinguish idle, disabled, offline and tripped',async({page})=>{
  await controlledFeeds(page);const pool=liveUsenet.pool.providers[0];
  const providers=[pool,{...pool,id:'idle',name:'Idle provider',acquired:0,throughput:0},{...pool,id:'disabled',name:'Disabled provider',state:'disabled' as const},{...pool,id:'offline',name:'Offline provider',state:'offline' as const},{...pool,id:'tripped',name:'Tripped provider',tripped:true,available:0,queued:2}];
  await page.route('**/usenet/live',route=>route.fulfill({json:{success:true,data:{...liveUsenet,pool:{...liveUsenet.pool,providers}}}}));
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,providers:[{...stats.providers[0],missRate:.2,errorRate:.1}]}}}));
  await page.goto('/mobile/#usenet');
  for(const [name,state] of [['Primary provider','Active'],['Idle provider','Idle'],['Disabled provider','Disabled'],['Offline provider','Active'],['Tripped provider','Active']])await expect(page.locator('.provider-card').filter({hasText:name}).locator('.badge').first()).toHaveText(state);
  await expect(page.getByText('Missing articles ≥10%')).toBeVisible();await expect(page.getByText('Errors ≥5%')).toBeVisible();await expect(page.getByText('No available connections · fetches queued')).toBeVisible();
  await expect(page.locator('.provider-card').filter({hasText:'Idle provider'}).locator('p.orange')).toHaveCount(0);
});

test('idle providers with cold sockets and stale rates never need attention',async({page})=>{
  await controlledFeeds(page);
  const provider={...liveUsenet.pool.providers[0],state:'offline' as const,acquired:0,queued:0,total:0,idle:0,tripped:true,throttled:true,throughput:1024**2};
  await page.route('**/usenet/live',route=>route.fulfill({json:{success:true,data:{...liveUsenet,pool:{...liveUsenet.pool,providers:[provider]}}}}));
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,providers:[{...stats.providers[0],missRate:.9,errorRate:.8}]}}}));
  await page.goto('/mobile/');await expect(page.getByText('0 active · 1 idle')).toBeVisible();await expect(page.getByText(/need attention/)).toHaveCount(0);
  await page.getByRole('link',{name:'Usenet',exact:true}).click();await expect(page.locator('.provider-card .badge').first()).toHaveText('Idle');await expect(page.locator('.provider-card p.orange')).toHaveCount(0);
  await page.getByRole('button',{name:/Primary provider/}).click();await expect(page.locator('.page > .badge')).toHaveText('Idle');
});

test('bottom bar stays at viewport bottom on short and long tabs',async({page})=>{
  await page.goto('/mobile/');
  for(const height of [844,724,900]) {
    await page.setViewportSize({width:390,height});
    for(const tab of ['Overview','Streams','More','Usenet','Logs']) {
      await page.getByRole('link',{name:tab,exact:true}).click();
      await expect.poll(()=>page.locator('.bottom-nav').evaluate(el=>Math.abs(el.getBoundingClientRect().bottom-innerHeight))).toBeLessThan(1);
      expect(await page.locator('.app').evaluate(el=>el.getBoundingClientRect().height>=innerHeight)).toBe(true);
    }
  }
});

test('empty states remain calm across monitoring screens',async({page})=>{
  await controlledFeeds(page);
  await page.route('**/streams/live',route=>route.fulfill({json:{success:true,data:{...liveStreams,streams:[],summary:{...liveStreams.summary,streaming:0,paused:0}}}}));
  await page.route('**/usenet/live',route=>route.fulfill({json:{success:true,data:{...liveUsenet,live:{...liveUsenet.live,activeStreams:0,currentBytesPerSec:0},pool:{...liveUsenet.pool,providers:[]}}}}));
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,indexers:[],providers:[]}}}));
  await page.route('**/streams/history?*',route=>route.fulfill({json:{success:true,data:{entries:[],total:0}}}));
  await page.goto('/mobile/');await expect(page.getByText('All quiet here')).toBeVisible();
  await page.getByRole('link',{name:'Usenet',exact:true}).click();await expect(page.getByText('No providers in the pool')).toBeVisible();await expect(page.getByText('No Usenet activity · waiting for playback.')).toBeVisible();
  await page.goto('/mobile/#indexers');await expect(page.getByText('No indexer activity')).toBeVisible();
  await page.getByRole('link',{name:'More',exact:true}).click();await page.getByRole('button',{name:/History & Bandwidth/}).click();await expect(page.getByText('No matching history')).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);
});

test('indexer sorting highlights concrete failures and diagnostics stay local',async({page})=>{
  await controlledFeeds(page);
  const rows=[stats.indexers[0],{...stats.indexers[0],indexer:'Troubled indexer',grabs:20,successRate:.4,failed:12,fetchAuth:3,fetchLimited:2}];
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,indexers:rows}}}));
  await page.goto('/mobile/#indexers');await expect(page.locator('.indexer-card').first().locator('h3')).toHaveText('Test indexer');
  await page.getByLabel('Sort indexers').selectOption('successRate');await expect(page.locator('.indexer-card').first().locator('h3')).toHaveText('Troubled indexer');
  await expect(page.getByText('3 auth failures')).toBeVisible();await expect(page.getByText('2 rate limited')).toBeVisible();
  await page.getByLabel('Sort indexers').selectOption('failed');await expect(page.locator('.indexer-card').first().locator('h3')).toHaveText('Troubled indexer');
  await emit(page,'/streams/',liveStreams);await fail(page,'/streams/');
  await page.goto('/mobile/#settings');await page.getByRole('button',{name:'Show diagnostics'}).click();await expect(page.getByText('Streams · SSE disconnected')).toBeVisible();
  const log=await page.locator('.diagnostics').innerText();expect(log).not.toMatch(/test-target|stream-1|192\.0\.2|The\.Expanse|https?:\/\//);
  await page.getByRole('button',{name:'Clear',exact:true}).click();await expect(page.getByText('No diagnostic events yet.')).toBeVisible();
});

test('stop progress and failure keep the confirmation actionable',async({page})=>{
  let finish:()=>void=()=>{};const released=new Promise<void>(resolve=>{finish=resolve;});
  await page.route('**/sessions/*',async route=>{await released;await route.fulfill({status:503,json:{success:false,error:{message:'Stop failed in fixture'}}});});
  await page.goto('/mobile/#stream/stream-1');await page.getByRole('button',{name:'Stop stream',exact:true}).click();
  const dialog=page.getByRole('alertdialog');await expect(dialog.getByText('The.Expanse.S01E01.2160p.mkv')).toBeVisible();
  await dialog.getByRole('button',{name:'Stop stream',exact:true}).click();await expect(dialog.getByRole('button',{name:'Stopping…'})).toBeDisabled();finish();
  await expect(dialog.getByRole('alert')).toContainText('Stop failed in fixture');await expect(dialog.getByRole('button',{name:'Stop stream',exact:true})).toBeEnabled();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
});

test('PWA update waits for explicit action while viewing a stream',async({page})=>{
  await page.addInitScript(()=>{
    const sw=new EventTarget();const reg=new EventTarget();
    Object.assign(reg,{waiting:{postMessage:()=>{Object.assign(window,{updateRequested:true});}}});
    Object.assign(sw,{controller:{},register:async()=>reg});
    Object.defineProperty(navigator,'serviceWorker',{value:sw});
    Object.assign(window,{simulateControllerChange:()=>sw.dispatchEvent(new Event('controllerchange'))});
  });
  await page.goto('/mobile/#stream/stream-1');await expect(page.getByText('A new version of AIOMobile is available.')).toBeVisible();
  await page.evaluate(()=>(window as unknown as {simulateControllerChange:()=>void}).simulateControllerChange());
  await expect(page.getByRole('button',{name:'Stop stream',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>(window as unknown as {updateRequested?:boolean}).updateRequested)).toBeUndefined();
  await page.getByRole('button',{name:'Update',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {updateRequested?:boolean}).updateRequested)).toBe(true);
});

test('detail Back preserves the originating page and navigation resets scroll',async({page})=>{
  await page.goto('/mobile/');await page.getByRole('button',{name:/The.Expanse/}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'More',exact:true}).click();await page.getByRole('button',{name:/History & Bandwidth/}).click();await expect(page.getByText('1–20 of 25')).toBeVisible();
  await page.evaluate(()=>window.scrollTo(0,600));await page.getByRole('link',{name:'Usenet',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Usenet',exact:true})).toBeVisible();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await page.goto('/mobile/#settings');expect(await page.getByLabel('AIOStreams base URL').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
});

test('capture major screens at iPhone dimensions with synthetic data',async({page,browserName})=>{
  test.skip(browserName!=='chromium','One set of review screenshots');
  await mkdir('docs/screenshots',{recursive:true});await page.setViewportSize({width:390,height:844});
  for(const [path,name] of [['overview','Overview'],['streams','Streams'],['stream/stream-1','Stream Details'],['usenet','Usenet'],['provider/p1','Provider Details'],['indexers','Indexers'],['history','History'],['settings','Settings']]){
    await page.goto(`/mobile/#${path}`);await expect(page.locator('.skeletons')).toHaveCount(0);await expect(page.locator('h1')).toBeVisible();
    // Allow two real fixture ticks for live charts and the entry transition.
    await page.waitForTimeout(3200);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const file=name.toLowerCase().replaceAll(' ','-');
    // A compact attention summary now precedes activity; both remain above the fold.
    if(path==='overview'){await expect(page.locator('.attention-panel > summary')).toBeInViewport();expect((await page.locator('.stream-card').first().boundingBox())?.y).toBeLessThan(600);}
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`docs/screenshots/${file}.png`});
    await page.screenshot({path:`docs/screenshots/${file}-full.png`,fullPage:true});
  }
});
