import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { addonAnalytics } from '../usage-fixtures';

// Synthetic samples exercise the reference layout, missing readings and unequal request volumes.
const examples = [
  {presetId:'Atlas',avgLatencyMs:1395,requests:100},
  {presetId:'Northstar',avgLatencyMs:757,requests:50},
  {presetId:'Long addon name with extra search configuration',avgLatencyMs:600,requests:300},
  {presetId:'Recorded zero',avgLatencyMs:0,requests:10},
  {presetId:'Missing timing',avgLatencyMs:null,requests:20},
  {presetId:'Idle addon',avgLatencyMs:34,requests:0},
].map((row,index) => ({...addonAnalytics.addons[0],...row,errors:[35,3,12,0,20,0][index],errorRate:[35,6,4,0,100,0][index]}));
const sample = {...addonAnalytics,total:480,addons:examples};
test.beforeEach(async ({context}) => { await context.request.get('/fixture/login'); });

test('response bars use a shared millisecond scale and retain readable labels on phones',async ({page},info) => {
  await page.route('**/analytics/addons?*',route => route.fulfill({json:{success:true,data:sample}}));
  await page.goto('/mobile/#addons');
  const chart = page.locator('.addon-response-times');
  await expect(chart.getByRole('meter')).toHaveCount(4);
  await expect(chart.locator('.response-addon-name').first()).toHaveText('Atlas');
  const atlas = chart.getByRole('meter',{name:'Atlas average response time',exact:true});
  await expect(atlas).toHaveAttribute('aria-valuenow','1395');
  await expect(atlas).toHaveAttribute('aria-valuemax','1500');
  await expect(atlas).toHaveAttribute('aria-valuetext','1,395 ms');
  await expect(chart.getByRole('meter',{name:'Recorded zero average response time',exact:true})).toHaveAttribute('aria-valuenow','0');
  await expect(chart.locator('.response-row').filter({hasText:'Missing timing'})).toContainText('Unavailable');
  await expect(chart.locator('.response-row').filter({hasText:'Idle addon'})).toContainText('No requests');
  await chart.getByRole('button',{name:'View data',exact:true}).click();
  await expect(chart.getByRole('table')).toBeVisible();
  await expect(chart.getByRole('row',{name:'Northstar 757 ms 50',exact:true})).toBeVisible();
  await chart.getByRole('button',{name:'Hide data',exact:true}).click();
  await expect(chart.getByRole('table')).toBeHidden();
  const errorChart=page.locator('.addon-error-rates');
  const errorMeter=errorChart.getByRole('meter',{name:'Atlas error rate',exact:true});
  await expect(errorMeter).toHaveAttribute('aria-valuenow','35');
  await expect(errorMeter).toHaveAttribute('aria-valuemax','100');
  await errorChart.getByRole('button',{name:'View data',exact:true}).click();
  await expect(errorChart.getByRole('row',{name:'Atlas 35.0% 35 100',exact:true})).toBeVisible();
  await errorChart.getByRole('button',{name:'Hide data',exact:true}).click();

  await mkdir('.impeccable/review/addon-response-times',{recursive:true});
  for(const [width,theme] of [[320,'paper'],[390,'sage'],[1280,'sage']] as const) {
    await page.setViewportSize({width,height:1000});
    await page.evaluate(theme => {document.documentElement.dataset.theme=theme;},theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const geometry = await atlas.evaluate(el => ({ratio:el.firstElementChild!.getBoundingClientRect().width / (el.getBoundingClientRect().width - parseFloat(getComputedStyle(el).borderInlineStartWidth))}));
    expect(geometry.ratio).toBeCloseTo(1395/1500,2);
    const labels = await chart.locator('.response-bar-value').evaluateAll(elements => elements.map(el => {
      const label=el.getBoundingClientRect(), card=el.closest('.addon-response-times')!.getBoundingClientRect();
      return label.left>=card.left && label.right<=card.right && label.height>=16;
    }));
    expect(labels.every(Boolean)).toBe(true);
    if(info.project.name==='chromium') {
      await chart.screenshot({scale:'css',path:`.impeccable/review/addon-response-times/${width}-${theme}.png`,style:'.topbar,.bottom-nav { visibility:hidden; }'});
      await errorChart.screenshot({scale:'css',path:`.impeccable/review/addon-response-times/errors-${width}-${theme}.png`,style:'.topbar,.bottom-nav { visibility:hidden; }'});
    }
  }
});

test('response chart follows period and search, independently of card sorting, and distinguishes missing data',async ({page}) => {
  const writes:string[]=[];
  page.on('request',request => {if(request.url().includes('/api/') && request.method()!=='GET')writes.push(request.url());});
  let missing=false;
  await page.route('**/analytics/addons?*',route => {
    const week=new URL(route.request().url()).searchParams.get('range')==='7d';
    return route.fulfill({json:{success:true,data:{...sample,addons:examples.map(row => ({...row,avgLatencyMs:missing ? null : week && row.presetId==='Atlas' ? 200 : row.avgLatencyMs}))}}});
  });
  await page.goto('/mobile/#addons');
  const chart=page.locator('.addon-response-times');
  await expect(chart.locator('.response-addon-name').first()).toHaveText('Atlas');
  await page.getByRole('combobox',{name:'Sort addons',exact:true}).selectOption('requests');
  await expect(page.locator('.addon-card').first().locator('h3')).toHaveText('Long addon name with extra search configuration');
  await expect(chart.locator('.response-addon-name').first()).toHaveText('Atlas');
  await page.getByRole('button',{name:'7D',exact:true}).click();
  await expect(chart).toContainText('Last 7d');
  await expect(chart.locator('.response-addon-name').first()).toHaveText('Northstar');
  await expect(chart.getByRole('meter',{name:'Atlas average response time',exact:true})).toHaveAttribute('aria-valuenow','200');
  await page.getByRole('searchbox',{name:'Search addons',exact:true}).fill('Atlas');
  await expect(chart.locator('.response-row')).toHaveCount(1);
  await page.getByRole('searchbox',{name:'Search addons',exact:true}).fill('');
  missing=true;
  await page.getByRole('button',{name:'Refresh dashboard',exact:true}).click();
  await expect(chart.getByRole('meter')).toHaveCount(0);
  await expect(chart).toContainText('No response times recorded in this window.');
  await expect(chart.locator('.response-axis')).toHaveCount(0);
  expect(writes).toEqual([]);
});
