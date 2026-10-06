import { test, expect } from '@playwright/test';
import { liveUsenet, liveStreams, stats } from '../fixtures';
test.beforeEach(async ({ context }) => { await context.request.get('/fixture/login'); });

test('attention links open the affected provider and indexer, with a route back', async ({ page }) => {
  await page.route('**/live/stream', route => route.abort());
  await page.route('**/usenet/live', route => route.fulfill({json:{success:true,data:{...liveUsenet,pool:{...liveUsenet.pool,providers:[{...liveUsenet.pool.providers[0],tripped:true}]}}}}));
  await page.route('**/usenet/stats?*', route => route.fulfill({json:{success:true,data:{...stats,indexers:[stats.indexers[0],{...stats.indexers[0],indexer:'Other indexer',failed:0}]}}}));
  await page.goto('/mobile/#overview');
  const attention=page.locator('.attention-panel');
  await expect(attention.locator('summary')).toContainText('2 sources');
  await attention.locator('summary').click();
  await attention.getByRole('link',{name:/Primary provider/}).click();
  await expect(page).toHaveURL(/#provider\/p1$/);
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(page.locator('h1')).toHaveText('Overview');
  await attention.locator('summary').click();
  await attention.getByRole('link',{name:/Test indexer/}).click();
  await expect(page).toHaveURL(/#indexers\/Test%20indexer$/);
  await expect(page.locator('.indexer-card')).toHaveCount(1);
  await expect(page.locator('.indexer-card')).toContainText('Test indexer');
  await page.reload();
  await expect(page.locator('.indexer-card')).toHaveCount(1);
  await page.getByRole('link',{name:'Show all indexers'}).click();
  await expect(page.locator('.indexer-card')).toHaveCount(2);
});

test('healthy idle sources stay quiet and missing health data is reported', async ({ page }) => {
  await page.route('**/live/stream', route=>route.abort());
  await page.route('**/usenet/live', route=>route.fulfill({json:{success:true,data:{...liveUsenet,pool:{...liveUsenet.pool,providers:[{...liveUsenet.pool.providers[0],acquired:0,queued:0,tripped:true,state:'offline'}]}}}}));
  let failing=false;
  await page.route('**/usenet/stats?*', route=>failing ? route.fulfill({status:503,json:{success:false}}) : route.fulfill({json:{success:true,data:{...stats,indexers:[]}}}));
  await page.goto('/mobile/');
  await expect(page.getByText('0 active · 1 idle')).toBeVisible();
  await expect(page.locator('.attention-panel')).toHaveCount(0);
  failing=true;
  await page.getByRole('button',{name:'Refresh dashboard'}).click();
  await expect(page.locator('.attention-panel > summary')).toContainText('Health checks unavailable');
  await page.locator('.attention-panel > summary').click();
  await expect(page.locator('.attention-body')).toContainText('may be stale');
  await expect(page.locator('.attention-body').getByRole('button',{name:'Retry'})).toBeVisible();
});

test('stream search combines with transport, sorting and refreshed data', async ({ page }) => {
  let data=liveStreams;
  await page.route('**/live/stream',route=>route.abort());
  await page.route('**/streams/live',route=>route.fulfill({json:{success:true,data}}));
  await page.goto('/mobile/#streams');
  await expect(page.locator('.stream-card').first()).toContainText('Planet.Earth');
  await page.getByLabel('Sort streams').selectOption('throughput');
  await expect(page.locator('.stream-card').first()).toContainText('The.Expanse');
  await page.getByLabel('Search streams').fill(' ALEX ');
  await expect(page.locator('.stream-card')).toHaveCount(1);
  await page.getByRole('button',{name:'Proxy',exact:true}).click();
  await expect(page.getByText('No matching streams',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Clear filters'}).click();
  await expect(page.locator('.stream-card')).toHaveCount(2);
  data={...liveStreams,streams:liveStreams.streams.map(s=>s.id==='stream-2' ? {...s,bytesPerSec:30*1024**2} : s)};
  await page.getByRole('button',{name:'Refresh dashboard'}).click();
  await expect(page.locator('.stream-card').first()).toContainText('Planet.Earth');
  await expect(page.getByLabel('Sort streams')).toHaveValue('throughput');
});

test('overview pins and ordering persist without reconnecting live feeds and restore defaults', async ({ page }) => {
  await page.goto('/mobile/');
  await expect(page.locator('.topbar .connection')).toHaveText('Live');
  let reconnects=0;page.on('request',r=>{if(r.url().includes('/live/stream'))reconnects++;});
  const order=()=>page.locator('[data-overview-section]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-overview-section')));
  await page.getByRole('button',{name:'Customize',exact:true}).click();
  await page.getByRole('button',{name:'Pin Bandwidth',exact:true}).click();
  await expect.poll(order).toEqual(['bandwidth','streams','providers','system','warnings']);
  await page.getByRole('button',{name:'Move Usenet health up',exact:true}).click();
  await expect.poll(order).toEqual(['bandwidth','providers','streams','system','warnings']);
  expect(reconnects).toBe(0);
  await page.reload();
  await expect.poll(order).toEqual(['bandwidth','providers','streams','system','warnings']);
  await page.getByRole('button',{name:'Customize',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pin Bandwidth',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Restore default layout'}).click();
  await expect.poll(order).toEqual(['streams','providers','bandwidth','system','warnings']);
  await page.reload();await expect.poll(order).toEqual(['streams','providers','bandwidth','system','warnings']);
});

test('advanced settings collapse, preserve drafts, and reopen for validation errors', async ({ page }) => {
  await page.goto('/mobile/#settings');
  const url=page.getByLabel('AIOStreams base URL');
  await expect(url).toBeHidden();
  const summary=page.locator('.advanced-settings > summary');
  await summary.focus();await page.keyboard.press('Enter');
  await expect(url).toBeVisible();
  await url.fill('not-a-url');
  await summary.click();
  await page.getByRole('button',{name:'Save preferences'}).click();
  await expect(url).toBeVisible();
  expect(await url.evaluate(el=>(el as HTMLInputElement).validity.valid)).toBe(false);
  await url.fill('https://user:secret@example.test');
  await summary.click();await expect(url).toBeHidden();
  await page.getByRole('button',{name:'Save preferences'}).click();
  await expect(url).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('without credentials');
  await url.fill('');await page.getByLabel('REST fallback interval').selectOption('30');
  await summary.click();await page.getByRole('button',{name:'Save preferences'}).click();
  await page.reload();await expect(url).toBeHidden();await summary.click();
  await expect(page.getByLabel('REST fallback interval')).toHaveValue('30');
});

test('customization, search, attention and advanced settings fit small phones in light and dark themes', async ({ page }) => {
  for(const theme of ['sage','paper']) {
    await page.addInitScript(theme=>localStorage.setItem('aiomobile.preferences',JSON.stringify({theme})),theme);
    await page.setViewportSize({width:320,height:740});
    await page.goto('/mobile/');
    await page.getByRole('button',{name:'Customize',exact:true}).click();
    await page.locator('.attention-panel > summary').click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole('link',{name:'Streams',exact:true}).click();
    await expect(page.getByLabel('Search streams')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.goto('/mobile/#settings');await page.locator('.advanced-settings > summary').click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});


test('failed layout storage keeps the current order and shows a useful error', async ({ page }) => {
  await page.goto('/mobile/');
  await page.getByRole('button',{name:'Customize',exact:true}).click();
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('Blocked');};});
  await page.getByRole('button',{name:'Pin Bandwidth',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Could not save the layout');
  await expect(page.getByRole('button',{name:'Pin Bandwidth',exact:true})).toHaveAttribute('aria-pressed','false');
  expect(await page.locator('[data-overview-section]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-overview-section')))).toEqual(['streams','providers','bandwidth','system','warnings']);
});
