import { test, expect } from '@playwright/test';
import { liveUsenet, stats } from '../fixtures';
test.beforeEach(async({context})=>{await context.request.get('/fixture/login');});
test('the X dismisses the collapsed notification, survives reload, and leaves indexer details intact',async({page})=>{
  const writes:string[]=[];page.on('request',request=>{if(request.url().includes('/api/') && request.method()!=='GET')writes.push(request.url());});
  await page.goto('/mobile/');const panel=page.locator('.attention-panel');await expect(panel).toContainText('1 source');
  await expect(panel).not.toHaveAttribute('open','');
  const dismiss=page.getByRole('button',{name:'Dismiss current health alerts',exact:true});
  expect(await dismiss.evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
  await dismiss.focus();await page.keyboard.press('Enter');
  await expect(panel).toHaveCount(0);await expect(page.locator('#main')).toBeFocused();
  expect(await page.evaluate(()=>localStorage.getItem('aiomobile.attention-dismissals'))).not.toContain('Test indexer');
  await page.reload();await expect(page.locator('.overview-summary')).toBeVisible();await expect(panel).toHaveCount(0);
  await page.goto('/mobile/#indexers');await expect(page.locator('.indexer-card')).toContainText('2');
  expect(writes).toEqual([]);
});
test('individual dismissals preserve other alerts and increased failures bring the source back',async({page})=>{
  let data=stats;
  await page.route('**/live/stream',route=>route.abort());
  await page.route('**/usenet/live',route=>route.fulfill({json:{success:true,data:{...liveUsenet,pool:{...liveUsenet.pool,providers:[{...liveUsenet.pool.providers[0],tripped:true}]}}}}));
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data}}));
  await page.goto('/mobile/');const panel=page.locator('.attention-panel');await expect(panel.locator('summary')).toContainText('2 sources');
  await panel.locator('summary').click();await page.getByRole('button',{name:'Dismiss alert for Primary provider',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'1 health alert dismissed on this device this visit.'})).toHaveCount(1);
  await expect(panel.locator('summary')).toContainText('1 source');await expect(panel.getByRole('link',{name:/Primary provider/})).toHaveCount(0);
  await page.getByRole('button',{name:'Dismiss current health alerts',exact:true}).click();await expect(panel).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'2 health alerts dismissed on this device this visit.'})).toHaveCount(1);
  data={...stats,indexers:[{...stats.indexers[0],failed:stats.indexers[0].failed+1}]};
  await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(panel.locator('summary')).toContainText('1 source');await panel.locator('summary').click();await expect(panel).toContainText('3 failed imports');
});
test('resolved alerts rearm, and dismissals do not conceal a health feed failure',async({page})=>{
  let data=stats;let unavailable=false;
  await page.route('**/usenet/stats?*',route=>unavailable ? route.fulfill({status:503,json:{success:false}}) : route.fulfill({json:{success:true,data}}));
  await page.goto('/mobile/');await page.getByRole('button',{name:'Dismiss current health alerts',exact:true}).click();await expect(page.locator('.attention-panel')).toHaveCount(0);
  unavailable=true;await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(page.locator('.attention-panel > summary')).toContainText('Health checks unavailable');
  unavailable=false;data={...stats,indexers:[{...stats.indexers[0],failed:0,fetchAuth:0,fetchLimited:0}]};
  await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('aiomobile.attention-dismissals') || '{}'))).toEqual({});
  data=stats;await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(page.locator('.attention-panel > summary')).toContainText('Needs attention');
});
test('dismiss works when storage is blocked and the controls fit mobile and desktop',async({page},testInfo)=>{
  await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='aiomobile.attention-dismissals')throw new Error('Blocked');return original.call(this,key,value);};});
  for(const width of [320,390,1280]){
    await page.setViewportSize({width,height:844});await page.goto('/mobile/');
    await expect(page.locator('.attention-panel > summary')).toContainText('Needs attention');
    const dismiss=page.getByRole('button',{name:'Dismiss current health alerts',exact:true});await expect(dismiss).toBeVisible();
    await page.locator('.attention-panel > summary').click();await expect(page.getByRole('button',{name:'Dismiss alert for Test indexer',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(testInfo.project.name==='webkit' && width!==390){await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0);});await page.screenshot({path:`.impeccable/review/attention-${width===320 ? 'mobile' : 'desktop'}.png`,fullPage:true,scale:'css'});}
    await dismiss.click();await expect(page.locator('.attention-panel')).toHaveCount(0);
  }
});
