import { test, expect } from '@playwright/test';
import { bandwidth, history, liveStreams, stats } from '../fixtures';
import { addonAnalytics } from '../usage-fixtures';
test.beforeEach(async ({ context }) => { await context.request.get('/fixture/login'); });

test('Usenet history changes windows, keeps provider context and exposes removed-provider records', async ({ page }) => {
  const windows:string[]=[];
  await page.route('**/usenet/stats?*',route => {
    const window=new URL(route.request().url()).searchParams.get('window')!;windows.push(window);
    return route.fulfill({json:{success:true,data:{...stats,window,providers:[...stats.providers,{...stats.providers[0],id:'retired',name:'Former provider',removed:true,enabled:false,live:{...stats.providers[0].live,state:'disabled',active:0}}]}}});
  });
  await page.goto('/mobile/#usenet');
  await expect(page.locator('.usenet-history')).toContainText('70 GB');
  await expect(page.getByRole('img',{name:/Data fetched, 4 recorded buckets/})).toBeVisible();
  await page.getByRole('button',{name:'Articles',exact:true}).click();await expect(page.getByRole('img',{name:/Articles fetched, 4 recorded buckets/})).toBeVisible();
  await page.getByRole('button',{name:'Errors',exact:true}).click();await expect(page.getByRole('img',{name:/Fetch errors, 4 recorded buckets. Latest 4/})).toBeVisible();
  await page.getByRole('button',{name:'7D',exact:true}).click();await expect.poll(()=>windows.at(-1)).toBe('7d');
  await page.getByRole('button',{name:/Primary provider/}).click();await expect(page.getByText('Statistics: last 7 days.')).toBeVisible();
  await page.getByRole('button',{name:'30D',exact:true}).click();await expect.poll(()=>windows.at(-1)).toBe('30d');
  await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.getByRole('button',{name:'30D',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:/Former provider/}).click();await expect(page.getByText('Removed provider',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Live throughput'})).toHaveCount(0);await expect(page.getByText('Historical statistics only;', {exact:false})).toBeVisible();
  await page.getByRole('button',{name:'All',exact:true}).click();await expect.poll(()=>windows.at(-1)).toBe('all');
});

test('stream capacity distinguishes open reads from activity and handles an unlimited cap', async ({ page }) => {
  let limit=8;
  await page.route('**/streams/live/stream',route=>route.abort());
  await page.route('**/streams/live',route=>route.fulfill({json:{success:true,data:{...liveStreams,streams:[{...liveStreams.streams[0],activeReads:0},liveStreams.streams[1],{...liveStreams.streams[0],id:'idle-session',activity:'idle',activeReads:0}],summary:{...liveStreams.summary,idle:1,connectionLimit:limit}}}}));
  await page.goto('/mobile/');await expect(page.locator('.stream-capacity')).toContainText('Global stream cap: 8 · 1 session reports open reads');
  await page.getByRole('link',{name:'Streams',exact:true}).click();await expect(page.locator('.stream-capacity')).toContainText('Idle sessions use no slot');
  limit=0;await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(page.locator('.stream-capacity')).toContainText('No global stream cap');
});

test('a failed live provider feed does not claim configured providers left the pool', async ({ page }) => {
  await page.route('**/usenet/live/stream', route=>route.abort());
  await page.route('**/usenet/live', route=>route.fulfill({status:503,json:{success:false,error:{message:'Unavailable'}}}));
  await page.goto('/mobile/#usenet');
  await expect(page.locator('.usenet-history')).toContainText('70 GB');
  await expect(page.getByRole('heading',{name:'Recorded provider history'})).toHaveCount(0);
  await expect(page.getByText('Not in live pool',{exact:true})).toHaveCount(0);
  await page.goto('/mobile/#provider/p1');
  await expect(page.getByText('Current pool membership is unavailable. Showing recorded statistics.')).toBeVisible();
  await expect(page.getByText('this provider is not in the live pool.',{exact:false})).toHaveCount(0);
});

test('user bandwidth trends preserve aggregate identity and only compare limits in the accounting period', async ({ page }) => {
  await page.route('**/streams/bandwidth?*',route=>{
    const window=new URL(route.request().url()).searchParams.get('window');
    return route.fulfill({json:{success:true,data:{...bandwidth,window,periodMode:'monthly',globalLimit:200,periodTotal:100,byUser:[{username:'alex',bytes:window==='30d'?250:50,limit:100,connectionLimit:4}],seriesByUser:[...bandwidth.seriesByUser,{username:'',series:bandwidth.seriesByUser[0].series},{username:'',aggregated:true,series:bandwidth.seriesByUser[1].series}]}}});
  });
  await page.goto('/mobile/#history');await expect(page.locator('.user-trends')).toContainText('Data served: alex');
  await page.getByLabel('User or group').selectOption({label:'sam'});await expect(page.getByRole('img',{name:/Data served: sam/})).toBeVisible();
  await page.getByLabel('User or group').selectOption({label:'Other users (combined)'});await expect(page.locator('.user-trends')).toContainText('Combined activity');
  await page.getByLabel('User or group').selectOption({label:'Unidentified streams'});await expect(page.locator('.user-trends')).toContainText('Recorded bandwidth for this user');
  await page.locator('.user-usage summary').click();await expect(page.locator('.user-usage meter')).toHaveCount(0);await expect(page.locator('.user-usage')).toContainText('Select Accounting period');
  await expect(page.locator('.period-usage')).toContainText('50.0%');
  await page.getByRole('button',{name:'Accounting period',exact:true}).click();await expect(page.locator('.user-usage')).toContainText('250.0%');
  await expect(page.locator('.user-usage meter')).toHaveAttribute('value','100');await expect(page.locator('.user-usage meter')).toHaveAttribute('aria-valuetext',/250.0% used/);
  await page.getByRole('button',{name:'7D',exact:true}).click();await expect(page.locator('.user-usage meter')).toHaveCount(0);
});

test('stream history reports session span and requests, including missing ends and malformed responses', async ({ page }) => {
  await page.route('**/streams/history?*',route=>route.fulfill({json:{success:true,data:{entries:[{...history[0],startedAt:1000,lastSeenAt:601000,endedAt:undefined}],total:1}}}));
  await page.goto('/mobile/#history');await page.getByText('Session details',{exact:true}).click();
  await expect(page.locator('.history-card')).toContainText('10m 0s');await expect(page.locator('.history-card')).toContainText('15');await expect(page.locator('.history-card')).toContainText('Not recorded');
  await page.unroute('**/streams/history?*');await page.route('**/streams/history?*',route=>route.fulfill({json:{success:true,data:{entries:[{...history[0],requests:'wrong'}],total:1}}}));
  await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(page.getByRole('alert')).toContainText('incompatible');await expect(page.locator('.history-card')).toContainText('10m 0s');
});

test('Addon health is navigable, read-only, formats percentages correctly and pauses offscreen', async ({ page }) => {
  await page.clock.install();let requests=0;const writes:string[]=[];
  await page.route('**/analytics/addons?*',route=>{requests++;return route.fulfill({json:{success:true,data:addonAnalytics}});});
  page.on('request',request=>{if(request.url().includes('/api/') && request.method()!=='GET')writes.push(request.url());});
  await page.goto('/mobile/');await expect(page.locator('.stream-card')).toHaveCount(2);expect(requests).toBe(0);
  await page.getByRole('link',{name:'More',exact:true}).click();await page.getByRole('button',{name:/Addon health/}).click();await expect(page.locator('h1')).toHaveText('Addon health');await expect(page.getByRole('link',{name:'More',exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.locator('.addon-card')).toHaveCount(20);await expect(page.locator('.addon-card').first()).toContainText('6.0%');await expect(page.locator('.addon-card').first()).not.toContainText('600.0%');
  await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.locator('.addon-card')).toHaveCount(4);
  await page.getByLabel('Search addons').fill('Recorded preset 1');await expect(page.locator('.addon-card')).toHaveCount(11);
  await page.getByRole('button',{name:'7D',exact:true}).click();await expect.poll(()=>requests).toBe(2);
  await page.getByRole('button',{name:'All rollups',exact:true}).click();await expect.poll(()=>requests).toBe(3);await expect(page.getByText('All retained daily rollups;', {exact:false})).toBeVisible();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.fastForward(125000);expect(requests).toBe(3);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>requests).toBe(4);
  await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect.poll(()=>requests).toBe(5);
  await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.locator('h1')).toHaveText('More');await page.clock.fastForward(65000);expect(requests).toBe(5);expect(writes).toEqual([]);
});

test('Addon health recovers from unavailable, empty, malformed and authentication states', async ({ page }) => {
  await page.clock.install();let requests=0;
  await page.route('**/analytics/addons?*',route=>{requests++;return route.fulfill({status:404,json:{success:false,error:{message:'Unavailable'}}});});
  await page.goto('/mobile/#addons');await expect(page.getByText('Addon analytics is unavailable')).toBeVisible();await page.clock.fastForward(125000);expect(requests).toBe(1);
  await page.unroute('**/analytics/addons?*');await page.route('**/analytics/addons?*',route=>route.fulfill({json:{success:true,data:{total:0,customEndpoints:0,addons:[]}}}));await page.getByRole('button',{name:'Check again'}).click();await expect(page.getByText('No addon requests recorded',{exact:true})).toBeVisible();
  await page.unroute('**/analytics/addons?*');await page.route('**/analytics/addons?*',route=>route.fulfill({json:{success:true,data:{...addonAnalytics,addons:[{...addonAnalytics.addons[0],avgLatencyMs:'oops'}]}}}));await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(page.getByRole('alert')).toContainText('incompatible');
  await page.unroute('**/analytics/addons?*');await page.route('**/analytics/addons?*',route=>{requests++;return route.fulfill({status:401,json:{success:false}});});await page.getByRole('button',{name:'Retry'}).click();await expect(page.getByRole('link',{name:'Sign in',exact:true})).toBeVisible();const before=requests;await page.clock.fastForward(125000);expect(requests).toBe(before);
});

test('historical charts keep empty and single-bucket states truthful and malformed buckets stay out', async ({ page }) => {
  let data={...stats,throughput:[stats.throughput[0]]};
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data}}));
  await page.goto('/mobile/#usenet');await expect(page.locator('.usenet-history')).toContainText('One recorded bucket · 10 GB');await expect(page.locator('.usenet-history')).not.toContainText('Collecting live samples');
  data={...stats,throughput:[]};await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(page.locator('.usenet-history')).toContainText('No recorded buckets');
  await page.unroute('**/usenet/stats?*');await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,throughput:[{bucketMs:1,bytes:1}]}}}));await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(page.getByRole('alert')).toContainText('incompatible');
});

test('expanded usage views fit small phones and desktop in light and dark themes', async ({ page }) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/mobile/');
  for(const [width,theme] of [[320,'paper'],[390,'sage'],[1280,'sage']] as const) {
    await page.evaluate(theme=>localStorage.setItem('aiomobile.preferences',JSON.stringify({theme})),theme);await page.reload();await page.setViewportSize({width,height:900});
    for(const route of ['usenet','provider/p1','history','addons','streams']) {
      await page.goto(`/mobile/#${route}`);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('.skeletons')).toHaveCount(0);
      if(route==='history'){await page.locator('.user-usage summary').first().click();await page.locator('.history-card summary').first().click();}
      if(route==='addons')await page.locator('.addon-card summary').first().click();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(route==='addons')expect(await page.getByLabel('Sort addons').evaluate(element=>element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
  }
  expect(errors).toEqual([]);
});
