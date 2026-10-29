import { test, expect } from '@playwright/test';
import { liveUsenet, stats } from '../fixtures';
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

test('history filters never hide current streams', async ({ page }) => {
  await page.goto('/mobile/#streams');
  await expect(page.locator('.current-streams .stream-card')).toHaveCount(2);
  await page.getByLabel('Search filename').fill('Episode.1.');
  await expect(page.locator('.history-card')).toHaveCount(1);
  await page.locator('.stream-history').getByRole('button', { name: 'Proxy', exact: true }).click();
  await expect(page.getByText('No matching history')).toBeVisible();
  await expect(page.locator('.current-streams .stream-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.history-card')).toHaveCount(20);
});

test('overview pins and ordering persist without reconnecting live feeds and restore defaults', async ({ page }) => {
  await page.goto('/mobile/');
  await expect(page.locator('.topbar .connection')).toHaveText('Live');
  let reconnects=0;page.on('request',r=>{if(r.url().includes('/live/stream'))reconnects++;});
  const order=()=>page.locator('[data-overview-section]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-overview-section')));
  await page.getByRole('button',{name:'Customize',exact:true}).click();
  await page.getByRole('button',{name:'Pin Bandwidth',exact:true}).click();
  await expect.poll(order).toEqual(['bandwidth','streams','providers','system','warnings','version']);
  await page.getByRole('button',{name:'Move Usenet health up',exact:true}).click();
  await expect.poll(order).toEqual(['bandwidth','providers','streams','system','warnings','version']);
  expect(reconnects).toBe(0);
  await page.reload();
  await expect.poll(order).toEqual(['bandwidth','providers','streams','system','warnings','version']);
  await page.getByRole('button',{name:'Customize',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pin Bandwidth',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Restore default layout'}).click();
  await expect.poll(order).toEqual(['streams','providers','bandwidth','system','warnings','version']);
  await page.reload();await expect.poll(order).toEqual(['streams','providers','bandwidth','system','warnings','version']);
});

test('overview sections hide and return with saved pins and order, including an empty layout', async ({ page }) => {
  const writes:string[]=[];
  page.on('request',r=>{if(r.url().includes('/api/') && r.method()!=='GET')writes.push(r.url());});
  await page.goto('/mobile/');
  await expect(page.locator('.topbar .connection')).toHaveText('Live');
  let reconnects=0;page.on('request',r=>{if(r.url().includes('/live/stream'))reconnects++;});
  const order=()=>page.locator('[data-overview-section]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-overview-section')));
  await page.getByRole('button',{name:'Customize',exact:true}).click();
  await page.getByRole('button',{name:'Pin Bandwidth',exact:true}).click();
  const bandwidth=page.getByRole('checkbox',{name:'Show Bandwidth',exact:true});
  await bandwidth.focus();await page.keyboard.press('Space');
  await expect(bandwidth).toBeFocused();await expect(bandwidth).not.toBeChecked();
  await expect.poll(order).toEqual(['streams','providers','system','warnings','version']);
  await expect(page.getByRole('button',{name:'Pin Bandwidth',exact:true})).toBeDisabled();
  await page.getByRole('checkbox',{name:'Show Usenet health',exact:true}).uncheck();
  await page.getByRole('button',{name:'Move System up',exact:true}).click();
  await expect.poll(order).toEqual(['system','streams','warnings','version']);
  expect(reconnects).toBe(0);
  await page.reload();
  await expect.poll(order).toEqual(['system','streams','warnings','version']);
  await page.getByRole('button',{name:'Customize',exact:true}).click();
  await expect(bandwidth).not.toBeChecked();
  await bandwidth.check();
  await expect(page.getByRole('button',{name:'Pin Bandwidth',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect.poll(order).toEqual(['bandwidth','system','streams','warnings','version']);
  for(const checkbox of await page.locator('.overview-customizer input[type=checkbox]').all())await checkbox.uncheck();
  await expect(page.locator('[data-overview-section]')).toHaveCount(0);
  await page.getByRole('button',{name:'Done',exact:true}).click();
  await expect(page.getByText('All sections are hidden. Choose Customize to add them back.')).toBeVisible();
  await page.reload();await expect(page.locator('[data-overview-section]')).toHaveCount(0);
  await page.getByRole('button',{name:'Customize',exact:true}).click();
  await bandwidth.check();await expect.poll(order).toEqual(['bandwidth']);
  await page.getByRole('button',{name:'Restore default layout'}).click();
  await expect.poll(order).toEqual(['streams','providers','bandwidth','system','warnings','version']);
  for(const checkbox of await page.locator('.overview-customizer input[type=checkbox]').all())await expect(checkbox).toBeChecked();
  await page.reload();await expect.poll(order).toEqual(['streams','providers','bandwidth','system','warnings','version']);
  expect(writes).toEqual([]);
});

test('overview visibility controls fit phone and desktop layouts', async ({ page },testInfo) => {
  for(const [width,theme] of [[320,'sage'],[390,'paper'],[1280,'sage']] as const){
    await page.setViewportSize({width,height:844});
    await page.goto('/mobile/');
    await page.evaluate(theme=>localStorage.setItem('aiomobile.preferences',JSON.stringify({theme})),theme);
    await page.reload();
    await page.getByRole('button',{name:'Customize',exact:true}).click();
    await page.getByRole('checkbox',{name:'Show AIOStreams version',exact:true}).uncheck();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const panel=page.locator('.overview-customizer');
    for(const label of await panel.locator('label').all()){
      const box=await label.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    if(testInfo.project.name==='webkit'){
      await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0);});
      await panel.screenshot({path:`.impeccable/review/overview-customizer/${width}-${theme}.png`,scale:'css'});
    }
  }
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
    await expect(page.getByLabel('Search filename')).toBeVisible();
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
  await page.getByRole('checkbox',{name:'Show Bandwidth',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Could not save the layout');
  await expect(page.getByRole('checkbox',{name:'Show Bandwidth',exact:true})).toBeChecked();
  expect(await page.locator('[data-overview-section]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-overview-section')))).toEqual(['streams','providers','bandwidth','system','warnings','version']);
});
