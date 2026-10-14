import { test, expect } from '@playwright/test';
import { bandwidth, stats } from '../fixtures';
import { mkdir } from 'node:fs/promises';

const hour = 3600000;
const end = Date.UTC(2026,9,14,21,30);
const start = Date.UTC(2026,9,13,21);
const sparse = [0,1,2,13,14,18,22,23].map((index,i) => ({bucketMs:start+index*hour,bytes:[1,.02,0,1.1,.05,.8,0,3.33][i]*1024**3,articles:[1500,20,10,1600,75,1200,0,5084][i],errors:i===3?1:0,missing:0,undecodable:0,avgLatencyMs:32,avgBytesPerSec:0}));
test.beforeEach(async ({ context, page }) => {
  await context.request.get('/fixture/login');
  await page.route('**/usenet/stats?*',route=>route.fulfill({json:{success:true,data:{...stats,generatedAt:end,totals:{...stats.totals,bytes:6.3*1024**3,articles:9489,errors:1},throughput:sparse}}}));
  await page.route('**/streams/bandwidth?*',route=>route.fulfill({json:{success:true,data:{...bandwidth,window:'24h',generatedAt:end,sinceMs:end-24*hour,bucketMs:hour,series:sparse.map(point=>({bucketMs:point.bucketMs,bytes:point.bytes})),seriesByUser:[{username:'alex',series:sparse.map(point=>({bucketMs:point.bucketMs,bytes:point.bytes}))}]}}}));
});

test('sparse historical data accumulates without fabricating missing or zero buckets', async ({ page }) => {
  const writes:string[]=[];
  page.on('request',request=>{if(request.url().includes('/api/') && request.method()!=='GET')writes.push(request.url());});
  await page.goto('/mobile/#usenet');
  const chart=page.locator('.usenet-history .recorded-chart');
  await expect(chart.getByRole('img')).toHaveAttribute('aria-label',/8 recorded buckets. Accumulated 6.3 GB/);
  await expect(chart).toContainText('Recorded bucket total');
  const slider=chart.getByRole('slider');
  await slider.fill('8');await expect(chart.locator('output')).toHaveText('No recorded bucket · 1 GB accumulated');
  await slider.fill('2');await expect(chart.locator('output')).toHaveText('0 B added · 1 GB accumulated');
  await slider.press('ArrowLeft');await expect(chart.locator('output')).toHaveText('20.5 MB added · 1 GB accumulated');
  await page.getByRole('button',{name:'Articles',exact:true}).click();await expect(chart.getByRole('img')).toHaveAttribute('aria-label',/Accumulated 9,489/);
  await page.getByRole('button',{name:'Errors',exact:true}).click();await expect(page.locator('.recorded-errors li')).toHaveCount(1);await expect(page.locator('.recorded-errors')).toContainText('1 error');
  await page.goto('/mobile/#history');await expect(page.locator('.user-trends .recorded-chart')).toContainText('6.3 GB');
  await expect(page.locator('.recorded-chart').first()).toContainText('Flat sections mean no additional activity recorded');
  expect(writes).toEqual([]);
});

test('recorded charts fit phone and desktop widths in both appearances', async ({ page }, testInfo) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await mkdir('.impeccable/review/recorded-charts',{recursive:true});
  for(const [width,theme] of [[320,'paper'],[390,'sage'],[1280,'sage']] as const){
    await page.addInitScript(theme=>localStorage.setItem('aiomobile.preferences',JSON.stringify({theme})),theme);
    await page.setViewportSize({width,height:1000});
    for(const route of ['usenet','history']){
      await page.goto(`/mobile/#${route}`);
      const chart=page.locator('.recorded-chart').first();await expect(chart.getByRole('img')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect(await chart.getByRole('slider').evaluate(element=>element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
      const labels=await chart.locator('svg text').evaluateAll(elements=>elements.map(element=>{const rect=element.getBoundingClientRect();return {left:rect.left,right:rect.right,width:rect.width};}));
      expect(labels.every(label=>label.left>=0 && label.right<=width && label.width>0)).toBe(true);
      if(testInfo.project.name==='chromium'){
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.screenshot({path:`.impeccable/review/recorded-charts/${route}-${width}-${theme}-page.png`,fullPage:true});
        await page.locator(route==='usenet'?'.usenet-history':'.user-trends').screenshot({path:`.impeccable/review/recorded-charts/${route}-${width}-${theme}.png`});
      }
    }
  }
  expect(errors).toEqual([]);
});
