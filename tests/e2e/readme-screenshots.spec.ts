import { test, expect } from '@playwright/test';
import { stats } from '../fixtures';
import { mkdir } from 'node:fs/promises';

test('capture current README screens with synthetic data', async ({ page, context }) => {
  await context.request.get('/fixture/login');
  await page.clock.install({time: new Date('2026-10-30T14:00:00Z')});
  await page.addInitScript(() => localStorage.setItem('aiomobile.preferences', JSON.stringify({theme:'sage',reducedMotion:true})));
  const examples = [['NZB Atlas',920,860,32,28],['Northstar',640,600,24,16],['NZB Grove',280,250,16,14],['Deep Index',160,136,8,16]] as const;
  const indexers = examples.map(([indexer,grabs,ok,degraded,failed]) => ({...stats.indexers[0],indexer,grabs,ok,degraded,failed,successRate:(ok+degraded)/grabs}));
  await page.route('**/usenet/stats?*', route => route.fulfill({json:{success:true,data:{...stats,window:new URL(route.request().url()).searchParams.get('window') || '24h',indexers}}}));
  await mkdir('docs/screenshots/readme',{recursive:true});
  for (const route of ['overview','streams','usenet','indexers','settings']) {
    await page.setViewportSize({width:390,height:route==='indexers' ? 1450 : 1120});
    await page.goto(`/mobile/#${route}`);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    if (route === 'overview' || route === 'streams') await expect(page.locator('.stream-card').first()).toContainText('Furthest file position');
    if (route === 'usenet') await expect(page.locator('svg[aria-label^="Provider throughput"]')).toBeVisible();
    if (route === 'indexers') await expect(page.locator('.indexer-share-tile')).toHaveCount(4);
    if (route === 'settings') {
      await page.getByRole('radio',{name:/Paper/}).check();
      await expect(page.locator('html')).toHaveAttribute('data-theme','paper');
      await expect(page.getByRole('checkbox',{name:'Show all transfers'})).toBeVisible();
    }
    await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); window.scrollTo(0,0); return document.fonts.ready; });
    await page.screenshot({path:`docs/screenshots/readme/${route}.png`,scale:'css',animations:'disabled'});
  }
});
