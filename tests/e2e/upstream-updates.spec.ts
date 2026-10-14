import { test, expect } from '@playwright/test';
import { mediaSummary, serverVersion } from '../monitoring-fixtures';
test.beforeEach(async({context})=>{await context.request.get('/fixture/login');});
const github='https://api.github.com/repos/Viren070/AIOStreams/releases?*';
test('server version uses an explicit, bounded GitHub check and resets on a changed build',async({page})=>{
  let checks=0;let current=serverVersion;
  await page.route('**/api/v1/status',route=>route.fulfill({json:{success:true,data:current}}));
  await page.route(github,route=>{checks++;return route.fulfill({json:[{tag_name:'v2.36.0',draft:false,prerelease:false},{tag_name:'v2.35.0',draft:false,prerelease:false}],headers:{link:'<https://api.github.com/next>; rel="next"','access-control-expose-headers':'link'}});});
  await page.goto('/mobile/');
  const card=page.locator('.server-version');await expect(card).toContainText('v2.35.0');expect(checks).toBe(0);
  await card.getByText('Build & updates',{exact:true}).click();
  await card.getByRole('button',{name:'Check for updates',exact:true}).click();
  await expect(card).toContainText('At least 1 newer release available');expect(checks).toBe(1);
  await expect(card.getByRole('link',{name:'All releases',exact:true})).toHaveAttribute('href','https://github.com/Viren070/AIOStreams/releases');
  current={...serverVersion,version:'2.36.0',tag:'v2.36.0'};
  await page.getByRole('button',{name:'Refresh dashboard'}).click();
  await expect(card).toContainText('Updates have not been checked.');expect(checks).toBe(1);
});
test('missing status and failed release checks remain recoverable without claiming up to date',async({page})=>{
  await page.route('**/api/v1/status',route=>route.fulfill({status:404,json:{success:false}}));
  await page.goto('/mobile/');await expect(page.getByText('Version information unavailable',{exact:true})).toBeVisible();
  await page.unroute('**/api/v1/status');await page.getByRole('button',{name:'Check again',exact:true}).click();
  const card=page.locator('.server-version');await expect(card).toContainText('v2.35.0');
  await page.route(github,route=>route.fulfill({status:403,json:{message:'rate limit'}}));
  await card.getByText('Build & updates',{exact:true}).click();await card.getByRole('button',{name:'Check for updates',exact:true}).click();
  await expect(card.getByRole('alert')).toContainText('rate limit');await expect(card).not.toContainText('Up to date');
});
test('metadata coverage distinguishes missing data, no eligible streams and filled results',async({page})=>{
  let summary=mediaSummary;
  await page.route('**/dashboard/media-info',route=>route.fulfill({json:{success:true,data:summary}}));
  await page.goto('/mobile/#media-info');
  const coverage=page.locator('.media-coverage');await expect(coverage).toContainText('24.0%');await expect(coverage).toContainText('240 of 1,000');
  await coverage.getByText('Sources & stored files',{exact:true}).click();await expect(coverage).toContainText('Probed here');await expect(coverage).toContainText('700 stored');await expect(coverage).toContainText('Other instances');
  summary={...mediaSummary,lookups:{eligible:0,filled:0,bySource:{}}};await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(coverage).toContainText('No eligible stream results recorded.');await expect(coverage).not.toContainText('0.0%');
  summary={...mediaSummary,lookups:undefined};await page.getByRole('button',{name:'Refresh dashboard'}).click();await expect(coverage).toContainText('Coverage is unavailable');
});
test('new monitoring content fits mobile and desktop and shows only read-only metadata',async({page},testInfo)=>{
  const writes:string[]=[];page.on('request',r=>{if(r.url().includes('/api/') && r.method()!=='GET')writes.push(r.url());});
  for(const [name,width] of [['mobile',390],['narrow',320],['desktop',1280]] as const){
    await page.setViewportSize({width,height:844});await page.goto('/mobile/#media-info');
    await page.getByText('Sources & stored files',{exact:true}).click();
    await page.getByRole('button',{name:'Stored files',exact:true}).click();await page.getByText('Metadata & tracks (3)',{exact:true}).click();
    const file=page.locator('.media-file');await expect(file).toContainText('Dolby Atmos');await expect(file).toContainText('10-bit');await expect(file).toContainText('Original language');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if(testInfo.project.name==='webkit' && name!=='narrow'){await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0);});await page.screenshot({path:`.impeccable/review/media-${name}.png`,fullPage:true,scale:'css'});await page.locator('.media-summary').screenshot({path:`.impeccable/review/coverage-${name}.png`,scale:'css'});}
    await page.goto('/mobile/');await page.locator('.server-version summary').click();await expect(page.locator('.server-version')).toContainText('Built');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if(testInfo.project.name==='webkit' && name!=='narrow'){await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0);});await page.screenshot({path:`.impeccable/review/version-${name}.png`,fullPage:true,scale:'css'});await page.locator('[data-overview-section=version]').screenshot({path:`.impeccable/review/version-card-${name}.png`,scale:'css'});}
  }
  expect(writes).toEqual([]);
});
