import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { liveUsenet, stats } from '../fixtures';

test.beforeEach(async ({ context, page }) => {
  await context.request.get('/fixture/login');
  await page.route('**/usenet/live/stream', route => route.abort());
});

test('connections distinguish warm idle from closed capacity and keep keyboard detail navigation', async ({ page }) => {
  const provider = liveUsenet.pool.providers[0];
  const providers = [provider,
    {...provider,id:'warm',name:'Warm backup',isBackup:true,acquired:0,total:4,idle:4},
    {...provider,id:'cold',name:'Cold provider',acquired:0,total:0,idle:0,max:0,throughput:0}];
  let failed = false;
  const writes: string[] = [];
  page.on('request', request => { if(request.url().includes('/api/') && request.method() !== 'GET') writes.push(request.url()); });
  await page.route('**/usenet/live', route => failed
    ? route.fulfill({status:503,json:{success:false}})
    : route.fulfill({json:{success:true,data:{...liveUsenet,pool:{...liveUsenet.pool,providers}}}}));
  await page.goto('/mobile/#usenet');
  const rows = page.locator('.connection-row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('6 in use · 8 open · 12 max');
  await expect(rows.nth(0).locator('.connection-used')).toHaveAttribute('style','transform: scaleX(0.5);');
  await expect(rows.filter({hasText:'Warm backup'})).toContainText('Backup');
  await expect(rows.filter({hasText:'Warm backup'})).toContainText('Last sample /conn');
  await expect(rows.filter({hasText:'Warm backup'}).locator('.connection-used')).toHaveAttribute('style','transform: scaleX(0);');
  expect(await rows.filter({hasText:'Warm backup'}).locator('.connection-open').evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(0);
  await expect(rows.filter({hasText:'Cold provider'}).locator('.connection-open')).toHaveAttribute('style','transform: scaleX(0);');
  expect(await page.locator('h2').allTextContents()).toEqual(expect.arrayContaining(['Live connections','Recorded activity']));
  const headings = await page.locator('h2').allTextContents();
  expect(headings.indexOf('Live connections')).toBeLessThan(headings.indexOf('Recorded activity'));
  await rows.first().focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'Speed per connection'})).toBeVisible();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(rows).toHaveCount(3);
  failed = true;await page.getByRole('button',{name:'Refresh dashboard'}).click();
  await expect(page.locator('.connections-summary')).toContainText('Last snapshot');
  await expect(rows).toHaveCount(3);
  expect(writes).toEqual([]);
});

test('connection rows fit narrow, tablet and desktop layouts with long names and warnings', async ({ page }, testInfo) => {
  const provider = liveUsenet.pool.providers[0];
  const providers = [provider,
    {...provider,id:'backup',name:'Backup provider',isBackup:true,acquired:0,total:4,idle:4},
    {...provider,id:'long',name:'A very long provider name with an unusually-long-unbroken-server-label.example.test',tripped:true,queued:3,available:0}];
  await page.route('**/usenet/live', route => route.fulfill({json:{success:true,data:{...liveUsenet,pool:{...liveUsenet.pool,providers}}}}));
  await mkdir('.impeccable/review/provider-connections',{recursive:true});
  const errors: string[] = [];page.on('pageerror',error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('aiomobile.preferences',JSON.stringify({theme:new URL(location.href).searchParams.get('theme'),reducedMotion:true})));
  for(const [width,theme] of [[320,'paper'],[390,'sage'],[768,'midnight'],[1280,'sage']] as const) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`/mobile/?theme=${theme}#usenet`);
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    await expect(page.locator('.connection-row')).toHaveCount(3);
    await expect(page.locator('.connection-row').filter({hasText:'A very long provider'})).toContainText('2 warnings');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.connection-row').evaluateAll(rows => rows.every(row => row.getBoundingClientRect().height >= 44 && row.scrollWidth <= row.clientWidth))).toBe(true);
    await expect(page.locator('.connection-used').first()).toHaveCSS('transition-duration','0s');
    if(testInfo.project.name === 'chromium') {
      await page.locator('.provider-connections').screenshot({path:`.impeccable/review/provider-connections/panel-${width}-${theme}.png`});
      await page.screenshot({path:`.impeccable/review/provider-connections/page-${width}-${theme}.png`,fullPage:true});
    }
  }
  expect(errors).toEqual([]);
});

test('an empty pool has an explicit empty state without connection bars', async ({ page }) => {
  await page.route('**/usenet/live',route => route.fulfill({json:{success:true,data:{...liveUsenet,pool:{...liveUsenet.pool,providers:[]}}}}));
  await page.goto('/mobile/#usenet');
  await expect(page.locator('.provider-connections')).toContainText('No providers in the pool.');
  await expect(page.locator('.connection-bar')).toHaveCount(0);
});


test('priority groups sort primaries before backups and keep unknown priorities explicit', async ({ page }, testInfo) => {
  const base = liveUsenet.pool.providers[0];
  const specs = [
    {id:'backup',name:'Backup one',priority:1,isBackup:true},
    {id:'secondary',name:'Second tier',priority:4,isBackup:false},
    {id:'first-a',name:'First A',priority:2,isBackup:false},
    {id:'first-b',name:'First B',priority:2,isBackup:false},
    {id:'unknown',name:'Unknown tier',priority:NaN,isBackup:false},
    {id:'removed',name:'Reconfigured tier',priority:1,isBackup:false},
  ];
  await page.route('**/usenet/live',route => route.fulfill({json:{success:true,data:{...liveUsenet,pool:{...liveUsenet.pool,providers:specs.map(row=>({...base,...row}))}}}}));
  await page.route('**/usenet/stats?*',route => route.fulfill({json:{success:true,data:{...stats,providers:specs.map(row=>({...stats.providers[0],...row,removed:row.id==='removed'}))}}}));
  await page.goto('/mobile/#usenet');
  const groups = page.locator('.connection-group');
  await expect(groups.locator('h3')).toHaveText(['Primary · Priority 2','Secondary · Priority 4','Providers · Priority unavailable','Backup · Priority 1']);
  await expect(groups.nth(0).locator('.connection-row')).toHaveCount(2);
  await expect(groups.nth(0)).toContainText('Load balanced · 2 providers');
  await expect(groups.nth(2)).not.toContainText('Load balanced');
  await expect(groups.nth(2).locator('.connection-row')).toHaveCount(2);
  if (testInfo.project.name === 'chromium') {
    await mkdir('.impeccable/review/provider-connections',{recursive:true});
    for (const width of [390,1280]) {
      await page.setViewportSize({width,height:1000});
      await page.locator('.provider-connections').screenshot({path:`.impeccable/review/provider-connections/groups-${width}.png`});
    }
  }
  await page.setViewportSize({width:320,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
