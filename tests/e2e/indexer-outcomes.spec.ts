import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { stats } from '../fixtures';
const samples=[['NZB Atlas',920,860,32,28],['Northstar',640,600,24,16],['NZB Grove',280,250,16,14],['Deep Index',160,136,8,16]] as const;
const rows=samples.map(([indexer,grabs,ok,degraded,failed])=>({...stats.indexers[0],indexer,grabs,ok,degraded,failed,successRate:(ok+degraded)/grabs}));
test.beforeEach(async({context})=>{await context.request.get('/fixture/login');});
test('outcomes and tile areas follow the selected window and selected indexer',async({page},info)=>{
  const writes:string[]=[];
  page.on('request',request=>{if(request.url().includes('/api/') && request.method()!=='GET') writes.push(request.url());});
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,indexers:new URL(route.request().url()).searchParams.get('window')==='7d' ? rows.slice(0,1) : rows}}}));
  await page.goto('/mobile/#indexers');
  const chart=page.locator('.indexer-outcomes');
  await expect(chart.locator('.outcome-rate')).toContainText('96.3%');
  await expect(chart.locator('header')).toContainText('2,000 grabs');
  await expect(chart.locator('.indexer-share-tile')).toHaveCount(4);
  await expect(chart.locator('.indexer-share-tile').first()).toContainText('46%');
  const size=await chart.locator('.indexer-share-tile').first().evaluate(el=>{const parent=el.parentElement!.getBoundingClientRect(),box=el.getBoundingClientRect();return box.width*box.height/(parent.width*parent.height);});
  expect(size).toBeCloseTo(.46,3);
  await mkdir('.impeccable/review/indexer-outcomes',{recursive:true});
  for(const [width,theme] of [[320,'paper'],[390,'sage'],[1280,'sage']] as const){
    await page.setViewportSize({width,height:1000});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await chart.locator('.outcome-legend').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    if(info.project.name==='chromium') await chart.screenshot({style:'.bottom-nav { visibility: hidden; }',path:`.impeccable/review/indexer-outcomes/${width}-${theme}.png`});
  }
  await page.getByRole('button',{name:'7D',exact:true}).click();
  await expect(chart.locator('header')).toContainText('920 grabs');
  await expect(chart.locator('.indexer-share-tile')).toHaveCount(1);
  await page.goto('/mobile/#indexers/Deep%20Index');
  await page.getByRole('button',{name:'24H',exact:true}).click();
  await expect(chart.locator('header')).toContainText('160 grabs');
  await expect(chart.locator('.outcome-rate')).toContainText('90%');
  expect(writes).toEqual([]);
});
test('zero grabs and inconsistent counts never imply a completion rate',async({page})=>{
  let indexers=[{...rows[0],grabs:0,ok:0,degraded:0,failed:0}];
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,indexers}}}));
  await page.goto('/mobile/#indexers');
  await expect(page.locator('.indexer-card')).toHaveCount(1);
  await expect(page.locator('.indexer-outcomes')).toHaveCount(0);
  indexers=[{...rows[0],ok:1}];
  await page.getByRole('button',{name:'Refresh dashboard'}).click();
  await expect(page.locator('.indexer-outcomes')).toContainText('Outcome counts do not match');
  await expect(page.locator('.outcome-rate')).toHaveCount(0);
});

test('many skewed indexers retain exact names and shares in the accessible breakdown',async({page})=>{
  const indexers=Array.from({length:24},(_,i)=>({...rows[0],indexer:`Long indexer name ${i} with detailed server label`,grabs:i ? 1 : 9977,ok:i ? 1 : 9977,degraded:0,failed:0}));
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,indexers}}}));
  await page.setViewportSize({width:320,height:844});
  await page.goto('/mobile/#indexers');
  await expect(page.locator('.indexer-share-tile')).toHaveCount(24);
  await expect(page.locator('.share-breakdown dl > div')).toHaveCount(24);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('names keep one size, never shrink vertically, and small shares have a visible key',async({page},info)=>{
  const indexers=[89,85,27,7,6,4,1].map((grabs,i)=>({...rows[0],indexer:['Alpha','BetaCentral','altHubTest','SmallNest','Tiny B','Tiny C','Tiny D'][i],grabs,ok:grabs,degraded:0,failed:0}));
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,indexers}}}));
  await page.goto('/mobile/#indexers');
  await expect(page.locator('.indexer-share-tile')).toHaveCount(7);
  for(const width of [320,390,440,1280]) {
    await page.setViewportSize({width,height:1000});
    // Container queries are evaluated after layout on both engines.
    await expect.poll(()=>page.locator('.share-tile-name').evaluateAll(names=>names.every(name=>getComputedStyle(name).fontSize==='14px'))).toBe(true);
    const checks=await page.locator('.share-tile-content').evaluateAll(tiles=>tiles.map(tile=>{
      const name=tile.querySelector('.share-tile-name')!, rate=tile.querySelector('strong')!;
      const n=name.getBoundingClientRect(),r=rate.getBoundingClientRect(),box=tile.getBoundingClientRect();
      const shown=getComputedStyle(name).display!=='none', rateShown=getComputedStyle(rate).display!=='none';
      return {line:!shown || n.height>=18,inside:!shown || (n.bottom<=box.bottom && n.top>=box.top),paired:!rateShown || (shown && n.bottom<=r.top && r.bottom<=box.bottom && r.right<=box.right)};
    }));
    expect(checks.every(check=>check.line && check.inside && check.paired)).toBe(true);
    const key=page.locator('.share-breakdown');
    await expect(key.getByText('SmallNest',{exact:true})).toBeVisible();
    await expect(key).toContainText('7 grabs · 3.2%');
    await expect(key.locator('dt')).toHaveCount(7);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(info.project.name==='chromium' && [390,1280].includes(width)) await page.locator('.indexer-outcomes').screenshot({style:'.bottom-nav { visibility:hidden; }',path:`.impeccable/review/indexer-outcomes/labels-${width}.png`});
  }
});

test('subject and direction independently sort indexer cards while keeping chart order stable',async({page},info)=>{
  const indexers=[
    {...rows[0],indexer:'Alpha',grabs:100,ok:70,degraded:10,failed:20,successRate:.8},
    {...rows[0],indexer:'Beta',grabs:50,ok:40,degraded:5,failed:5,successRate:.9},
    {...rows[0],indexer:'Gamma',grabs:200,ok:170,degraded:20,failed:10,successRate:.95},
  ];
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,indexers}}}));
  await page.goto('/mobile/#indexers');
  const names=page.locator('.indexer-card h3');
  const subject=page.getByRole('combobox',{name:'Sort indexers',exact:true});
  const chart=await page.locator('.indexer-treemap').innerHTML();
  await expect(names).toHaveText(['Gamma','Alpha','Beta']);
  await page.getByRole('button',{name:'Descending. Switch to ascending',exact:true}).click();
  await expect(names).toHaveText(['Beta','Alpha','Gamma']);
  await subject.selectOption('successRate');
  await expect(names).toHaveText(['Alpha','Beta','Gamma']);
  await page.getByRole('button',{name:'Ascending. Switch to descending',exact:true}).click();
  await expect(names).toHaveText(['Gamma','Beta','Alpha']);
  await subject.selectOption('failed');
  await expect(names).toHaveText(['Alpha','Gamma','Beta']);
  await page.getByRole('button',{name:'Descending. Switch to ascending',exact:true}).click();
  await expect(names).toHaveText(['Beta','Gamma','Alpha']);
  expect(await page.locator('.indexer-treemap').innerHTML()).toBe(chart);
  expect(await page.locator('.indexer-sort-controls').evaluate(el=>!!(el.previousElementSibling?.classList.contains('indexer-success') && el.nextElementSibling?.classList.contains('stack')))).toBe(true);
  await page.setViewportSize({width:320,height:844});
  expect(await page.locator('.indexer-sort-controls').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  expect(await page.getByRole('button',{name:'Ascending. Switch to descending',exact:true}).evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  if(info.project.name==='chromium') for(const width of [320,1280]) {
    await page.setViewportSize({width,height:1000});
    await page.locator('.indexer-sort-controls').screenshot({style:'.bottom-nav { visibility:hidden; }',path:`.impeccable/review/indexer-outcomes/sort-${width}.png`});
  }
});


test('success bars include degraded imports, follow the window and never give idle indexers a zero rate',async({page},info)=>{
  const indexers=[
    {...rows[0],indexer:'Alpha',grabs:100,ok:80,degraded:10,failed:10},
    {...rows[0],indexer:'Long indexer name with an unusually-long-unbroken-server-label.example.test',grabs:100,ok:50,degraded:0,failed:50},
    {...rows[0],indexer:'Idle',grabs:0,ok:0,degraded:0,failed:0},
    {...rows[0],indexer:'Invalid',grabs:10,ok:20,degraded:0,failed:0},
  ];
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,window:new URL(route.request().url()).searchParams.get('window'),indexers:new URL(route.request().url()).searchParams.get('window')==='7d' ? [{...indexers[0],ok:100,degraded:0,failed:0}] : indexers}}}));
  await page.goto('/mobile/#indexers');
  const chart=page.getByRole('region',{name:'Success rate by indexer',exact:true});
  await expect(chart.getByRole('meter',{name:'Alpha success rate',exact:true})).toHaveAttribute('aria-valuenow','90');
  await expect(chart.locator('li').first()).toContainText('90 of 100 grabs successful');
  await expect(chart.locator('li').filter({hasText:'Idle'})).toContainText('No grabs');
  await expect(chart.locator('li').filter({hasText:'Invalid'})).toContainText('Unavailable');
  await expect(chart.getByRole('meter')).toHaveCount(2);
  expect(await chart.evaluate(el=>el.previousElementSibling?.classList.contains('indexer-outcomes'))).toBe(true);
  for(const [width,theme] of [[320,'paper'],[390,'sage'],[1280,'sage']] as const){
    await page.setViewportSize({width,height:1000});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(info.project.name==='chromium') await chart.screenshot({style:'.bottom-nav, .topbar, .skip-link { visibility:hidden; }',path:`.impeccable/review/indexer-outcomes/success-${width}.png`});
  }
  await page.getByRole('button',{name:'7D',exact:true}).click();
  await expect(chart).toContainText('Last 7d');
  await expect(chart.getByRole('meter')).toHaveCount(1);
  await expect(chart.getByRole('meter')).toHaveAttribute('aria-valuenow','100');
});
