import { test, expect } from '@playwright/test';
import { liveStreams } from '../fixtures';
test.beforeEach(async({context})=>{await context.request.get('/fixture/login');});
test('mobile screens display contract fields, detail charts and provider/indexer metrics',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/mobile/');await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'Live'})).toBeVisible();
  await expect(page.getByText('780 GB',{exact:true})).toBeVisible();
  const bandwidthMetric=page.locator('.summary-reading').filter({hasText:'To clients'}).locator('strong');
  const initialBandwidth=await bandwidthMetric.innerText();
  await expect.poll(()=>bandwidthMetric.innerText()).not.toBe(initialBandwidth);
  await page.getByRole('link',{name:'Streams',exact:true}).click();
  await page.getByRole('button',{name:/The.Expanse/}).click();
  await expect(page.getByText('25.0%',{exact:true})).toBeVisible();await expect(page.getByText('4 GB',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('link',{name:'Usenet',exact:true}).click();
  await expect(page.getByText('4,520',{exact:true})).toBeVisible();await page.getByRole('button',{name:/Primary provider/}).click();
  await expect(page.getByText('news.example.test',{exact:true})).toBeVisible();await expect(page.getByText('120,000',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'More',exact:true}).click();await page.getByRole('button',{name:/Indexers Grab/}).click();await expect(page.getByText('98.0% success')).toBeVisible();
  for(const width of [320,390,768,1280]) {await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  expect(errors).toEqual([]);
});
test('history uses q, transport and username filters and server pagination',async({page})=>{
  await page.addInitScript(() => localStorage.setItem('aiomobile.preferences', JSON.stringify({ showAllTransfers:true })));
  await page.goto('/mobile/#streams');await expect(page.getByText('1–20 of 25')).toBeVisible();
  await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByText('21–25 of 25')).toBeVisible();
  await page.getByLabel('Search filename').fill('Episode.1.');await expect(page.getByText('1–1 of 1')).toBeVisible();
  await page.locator('.stream-history').getByRole('button',{name:'Proxy',exact:true}).click();await expect(page.getByText('No matching history')).toBeVisible();
  await page.locator('.stream-history').getByRole('button',{name:'Usenet',exact:true}).click();await page.getByLabel('Username',{exact:true}).fill('alex');await expect(page.getByText('Episode.1.mkv',{exact:true})).toBeVisible();
});
test('401 stops automated retries and shows existing same-origin sign-in',async({page,context})=>{
  await context.clearCookies();let requests=0;page.on('request',r=>{if(r.url().includes('/api/'))requests++;});
  await page.goto('/mobile/');await expect(page.getByText('Sign in to AIOStreams to continue.').first()).toBeVisible();
  await expect(page.getByRole('link',{name:'Sign in',exact:true}).first()).toHaveAttribute('href',/\/login\?next=%2Fmobile%2F/);
  const before=requests;await page.clock.install();await page.clock.fastForward(120000);expect(requests).toBe(before);
});
test('failed SSE falls back to bounded polling and accepts snapshot updates',async({page})=>{
  await page.clock.install();
  await page.route('**/live/stream',route=>route.abort());let calls=0;
  await page.route('**/streams/live',route=>{calls++;return route.fulfill({json:{success:true,data:{...liveStreams,summary:{...liveStreams.summary,totalBytesPerSec:42*1024**2}}}});});
  await page.goto('/mobile/');await expect(page.locator('.summary-reading').filter({hasText:'To clients'}).locator('strong')).toHaveText('42');await expect(page.getByText('REST fallback',{exact:true})).toBeVisible();
  const before=calls;await page.clock.fastForward(15000);await expect.poll(()=>calls).toBeGreaterThan(before);expect(calls-before).toBeLessThanOrEqual(2);
});
test('settings reject credentials and drafts do not contact a new address',async({page})=>{
  const outgoing:string[]=[];page.on('request',r=>{if(new URL(r.url()).hostname==='example.test')outgoing.push(r.url());});
  await page.goto('/mobile/#settings');await page.locator('.advanced-settings > summary').click();await page.getByLabel('AIOStreams base URL').fill('https://user:secret@example.test');
  await page.getByRole('button',{name:'Save preferences'}).click();await expect(page.getByRole('alert').filter({hasText:'without credentials'})).toBeVisible();
  await page.getByLabel('AIOStreams base URL').fill('https://example.test');await expect(page.getByLabel('AIOStreams base URL')).toHaveValue('https://example.test');expect(outgoing).toEqual([]);
});
test('stop requires confirmation, cancellation sends no DELETE, and success is shown',async({page})=>{
  let deletes=0;await page.route('**/sessions/*',route=>{deletes++;return route.fulfill({json:{success:true,data:{stopped:true}}});});
  await page.goto('/mobile/#stream/stream-1');await expect(page.getByText('25.0%',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Stop stream',exact:true}).click();await page.getByRole('button',{name:'Keep streaming'}).click();expect(deletes).toBe(0);
  await page.getByRole('button',{name:'Stop stream',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Stop stream',exact:true}).click();await expect(page.getByText('Stream stopped',{exact:true})).toBeVisible();expect(deletes).toBe(1);
});
test('production service worker caches shell but never authenticated data',async({browser,browserName,baseURL})=>{
  const fixtureOrigin=new URL(baseURL!).origin;
  const context=await browser.newContext({serviceWorkers:'allow',viewport:{width:390,height:844}});await context.request.get(`${fixtureOrigin}/fixture/login`);
  const page=await context.newPage();await page.goto(`${fixtureOrigin}/mobile/`);await expect(page.getByText('780 GB',{exact:true})).toBeVisible();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  const cached=await page.evaluate(async()=>{const all=[];for(const name of await caches.keys()){const cache=await caches.open(name);all.push(...(await cache.keys()).map(r=>new URL(r.url).pathname));}return all;});
  expect(cached).toContain('/mobile/index.html');expect(cached.every(path=>path.startsWith('/mobile/') && !path.includes('/api/'))).toBe(true);
  try {
    // WebKit's offline emulation rejects SW navigation even for a literal response:
    // https://github.com/microsoft/playwright/issues/42775
    // Refuse origin connections for WebKit; Chromium tests network offline mode.
    if(browserName==='webkit')await context.request.post(`${fixtureOrigin}/fixture/offline`);
    else await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading',{name:'Overview',exact:true})).toBeVisible();
    if(browserName==='webkit')await expect(page.getByText(/Cannot reach AIOStreams/).first()).toBeVisible();
    else await expect(page.getByText('You’re offline. Previously received data may be outdated.')).toBeVisible();
    await expect(page.getByText('780 GB',{exact:true})).toHaveCount(0);
  } finally {
    if(browserName==='webkit')await context.request.post(`${fixtureOrigin}/fixture/online`);
    await context.close();
  }
});

test('past stream ordering spans pages and bandwidth no longer requests stream history', async ({ page }) => {
  await page.goto('/mobile/#streams');
  await expect(page.locator('.history-card h3').first()).toHaveText('Episode.1.mkv');
  await page.getByLabel('Sort history').selectOption('oldest');
  await expect(page.locator('.history-card h3').first()).toHaveText('Episode.25.mkv');
  await expect(page.locator('.history-card h3').last()).toHaveText('Episode.6.mkv');
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await expect(page.locator('.history-card h3').first()).toHaveText('Episode.5.mkv');
  await expect(page.locator('.history-card h3').last()).toHaveText('Episode.1.mkv');
  await page.getByRole('button',{name:'Previous',exact:true}).click();
  await expect(page.locator('.history-card h3').first()).toHaveText('Episode.25.mkv');
  await page.getByLabel('Search filename').fill('Episode.1.');
  await expect(page.locator('.history-card')).toHaveCount(1);
  await expect(page.locator('.history-card h3')).toHaveText('Episode.1.mkv');
  await page.goto('/mobile/#history');
  await expect(page.locator('.history-card')).toHaveCount(0);
  let historyRequests=0;page.on('request',request=>{if(request.url().includes('/streams/history'))historyRequests++;});
  await page.getByRole('button',{name:'Refresh dashboard'}).click();
  await expect(page.locator('.user-trends')).toBeVisible();
  expect(historyRequests).toBe(0);
});

test('a session present in live data never appears in past streams', async ({ page }) => {
  await page.route('**/streams/history?*', route => route.fulfill({json:{success:true,data:{entries:[{...liveStreams.streams[0],endedAt:Date.now(),endReason:'idle'}],total:1}}}));
  await page.goto('/mobile/#streams');
  await expect(page.locator('.current-streams .stream-card')).toHaveCount(2);
  await expect(page.locator('.history-card')).toHaveCount(0);
});

test('current streams and history controls fit phone and desktop themes', async ({ page }, testInfo) => {
  for (const [width,theme] of [[320,'sage'],[390,'paper'],[1280,'sage']] as const) {
    await page.setViewportSize({width,height:844});
    await page.addInitScript(theme=>localStorage.setItem('aiomobile.preferences',JSON.stringify({theme})),theme);
    await page.goto('/mobile/#streams');
    await expect(page.locator('.history-card')).toHaveCount(20);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await page.getByLabel('Sort history').boundingBox())!.height).toBeGreaterThanOrEqual(44);
    if(testInfo.project.name==='webkit') {
      await page.screenshot({path:`.impeccable/review/streams-history/${width}-${theme}-active.png`,scale:'css'});
      await page.locator('#stream-history-heading').evaluate(node=>window.scrollTo(0,node.getBoundingClientRect().top+window.scrollY-80));
      await page.screenshot({path:`.impeccable/review/streams-history/${width}-${theme}-history.png`,scale:'css'});
    }
  }
});
