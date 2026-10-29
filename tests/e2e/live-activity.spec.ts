import { test, expect } from '@playwright/test';
import { liveStreams, liveUsenet } from '../fixtures';

test.beforeEach(async ({ context }) => { await context.request.get('/fixture/login'); });

test('live overview counts all current sessions including buffered players and keeps unavailable Usenet distinct from zero', async ({ page }) => {
  await page.route('**/live/stream', route => route.abort());
  await page.route('**/streams/live', route => route.fulfill({ json: { success: true, data: { ...liveStreams, summary: { ...liveStreams.summary, streaming: 2, paused: 3, idle: 4 } } } }));
  await page.route('**/usenet/live', route => route.fulfill({ status: 503, json: { success: false } }));
  await page.goto('/mobile/');
  const card = page.getByRole('region', { name: 'Live activity' });
  await expect(card.locator('strong')).toHaveText(['2', '12', '—']);
  await expect(card).toContainText('Updates unavailable');
  await expect(card.locator('.stream-capacity')).toHaveCount(0);
});

test('live overview is aligned and compact on phones and desktop in both themes', async ({ page }, testInfo) => {
  for (const [width, theme] of [[320, 'sage'], [390, 'sage'], [390, 'paper'], [1280, 'sage']] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(theme => localStorage.setItem('aiomobile.preferences', JSON.stringify({ theme })), theme);
    await page.goto('/mobile/');
    const card = page.getByRole('region', { name: 'Live activity' });
    await expect(card.locator('.summary-freshness')).toHaveText('Live');
    const metrics = await card.locator('strong').evaluateAll(nodes => nodes.map(node => ({ size: getComputedStyle(node).fontSize, top: node.getBoundingClientRect().top, clipped: node.scrollWidth > node.clientWidth })));
    expect(new Set(metrics.map(metric => metric.size)).size).toBe(1);
    expect(new Set(metrics.map(metric => metric.top)).size).toBe(1);
    expect(metrics.some(metric => metric.clipped)).toBe(false);
    expect((await card.boundingBox())!.height).toBeLessThan(210);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (testInfo.project.name === 'webkit') await page.screenshot({ path: `.impeccable/review/live-activity/${width}-${theme}.png` });
  }
});

test('idle overview shows real zero readings', async ({ page }) => {
  await page.route('**/live/stream', route => route.abort());
  await page.route('**/streams/live', route => route.fulfill({ json: { success: true, data: { ...liveStreams, streams: [], summary: { ...liveStreams.summary, streaming: 0, paused: 0, idle: 0, totalBytesPerSec: 0 } } } }));
  await page.route('**/usenet/live', route => route.fulfill({ json: { success: true, data: { ...liveUsenet, live: { ...liveUsenet.live, currentBytesPerSec: 0 } } } }));
  await page.goto('/mobile/');
  await expect(page.locator('.summary-reading strong')).toHaveText(['0', '0', '0']);
  await expect(page.locator('.summary-freshness')).toHaveText('Periodic updates');
});

test('live activity updates client throughput from successive live frames', async ({ page }) => {
  await page.goto('/mobile/');
  const card = page.getByRole('region', { name: 'Live activity' });
  await expect(card.locator('strong').first()).toHaveText('2');
  await expect(card.locator('.summary-freshness')).toHaveText('Live');
  const rate = card.locator('strong').nth(1);
  const initial = await rate.textContent();
  await expect(rate).not.toHaveText(initial!);
});

test('buffered sessions stay active when no bytes are moving', async ({ page }) => {
  await page.route('**/live/stream', route => route.abort());
  await page.route('**/streams/live', route => route.fulfill({ json: { success: true, data: {
    ...liveStreams,
    streams: liveStreams.streams.map(stream => ({ ...stream, activity: 'paused', bytesPerSec: 0 })),
    summary: { ...liveStreams.summary, streaming: 0, paused: 2, idle: 0, totalBytesPerSec: 0 },
  } } }));
  await page.goto('/mobile/');
  const card = page.getByRole('region', { name: 'Live activity' });
  await expect(card.locator('strong')).toHaveText(['2', '0', String(liveUsenet.live.currentBytesPerSec / 1024 ** 2)]);
});
