import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { liveStreams } from '../fixtures';

test.beforeEach(async ({ context }) => { await context.request.get('/fixture/login'); });

const routes = ['overview', 'streams', 'stream/stream-1', 'usenet', 'provider/p1', 'logs', 'indexers', 'history', 'settings', 'more'];
const headings: Record<string, string> = {
  overview: 'Overview', streams: 'Active streams', 'stream/stream-1': 'The.Expanse.S01E01.2160p.mkv',
  usenet: 'Usenet', 'provider/p1': 'Primary provider', logs: 'Logs', indexers: 'Indexers',
  history: 'History & bandwidth', settings: 'Settings', more: 'More',
};
// Safari's smaller viewports for the Duo's outer, inner, and split-screen layouts.
const duoViewports = [
  { width: 382, height: 580 },
  { width: 594, height: 368 },
  { width: 669, height: 867 },
  { width: 951, height: 585 },
  { width: 385, height: 571 },
];

test('all screens fit small phones, landscape, tablets and desktop without clipped values', async ({ page, browserName }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  if (browserName === 'chromium') await mkdir('docs/screenshots/ui-refresh', { recursive: true });
  for (const viewport of [{ width: 320, height: 690 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1280, height: 900 }, ...duoViewports]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(`/mobile/#${route}`);
      await expect(page.locator('h1')).toHaveText(headings[route]);
      await expect(page.locator(`.page-${route.split('/')[0]}`)).toBeVisible();
      await expect(page.locator('.skeletons')).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      if (route === 'logs') await expect(page.locator('.log-row').first()).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect.poll(() => page.locator('.bottom-nav').evaluate(el => Math.abs(el.getBoundingClientRect().bottom - innerHeight))).toBeLessThan(1);
      const clipped = await page.locator('.summary-grid strong, .metric strong, .provider-metrics strong, .indexer-grid strong').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent));
      expect(clipped, `${route} at ${viewport.width}px`).toEqual([]);
      const nav = await page.locator('.bottom-nav a').evaluateAll(elements => elements.every(el => el.getBoundingClientRect().height >= 44));
      expect(nav).toBe(true);
      if (route === 'logs') {
        const list = await page.locator('.log-list').boundingBox();
        const bar = await page.locator('.bottom-nav').boundingBox();
        const shortLandscape = viewport.width > viewport.height && viewport.height <= 500;
        expect(list!.height, `Logs at ${viewport.width}×${viewport.height}`).toBeGreaterThan(shortLandscape ? 112 : 50);
        expect(list!.y + list!.height).toBeLessThanOrEqual(bar!.y);
      }
      if (browserName === 'chromium' && (viewport.width === 1280 && ['overview', 'history', 'settings', 'logs'].includes(route) || viewport.width === 390 && route === 'more' || viewport.width === 844 && route === 'logs')) {
        await page.screenshot({ path: `docs/screenshots/ui-refresh/${route}-${viewport.width}.png` });
      }
    }
  }
  expect(errors).toEqual([]);
});

test('Home Screen tab bar stays anchored while resizing and scrolling Usenet', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
  await page.setViewportSize(duoViewports[0]);
  await page.goto('/mobile/#usenet');
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  const scrollArea = page.locator('.app-scroll');
  await expect(page.getByRole('heading', { name: 'Live connections' })).toBeVisible();

  for (const [index, viewport] of [...duoViewports, duoViewports[0]].entries()) {
    await page.setViewportSize(viewport);
    await scrollArea.evaluate((el, top) => el.scrollTo(0, top), (index + 1) * 120);
    await expect.poll(() => scrollArea.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await expect.poll(() => nav.evaluate(el => {
      const viewport = window.visualViewport;
      return Math.abs(el.getBoundingClientRect().bottom - (viewport ? viewport.offsetTop + viewport.height : innerHeight));
    })).toBeLessThan(1);
    expect(await scrollArea.evaluate(el => el.getBoundingClientRect().bottom)).toBe((await nav.boundingBox())!.y);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  }

  await nav.getByRole('link', { name: 'Logs' }).click();
  await expect(page.getByRole('heading', { name: 'Logs', exact: true })).toBeVisible();
  await expect.poll(() => scrollArea.evaluate(el => el.scrollTop)).toBe(0);
  const logList = page.getByRole('region', { name: 'Log entries' });
  await expect.poll(async () => (await logList.boundingBox())!.height).toBeGreaterThan(112);
});

test('wide Overview puts visible tiles in order when there are no active streams', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true });
    const overview = ['streams', 'providers', 'bandwidth', 'system', 'warnings', 'version'].map(id => ({
      id, pinned: false, visible: id !== 'system' && id !== 'warnings',
    }));
    localStorage.setItem('aiomobile.preferences', JSON.stringify({ overview }));
  });
  await page.route('**/streams/live/stream', route => route.abort());
  await page.route('**/streams/live', route => route.fulfill({ json: {
    success: true,
    data: { ...liveStreams, streams: [], summary: { ...liveStreams.summary, streaming: 0, paused: 0, idle: 0, totalBytesPerSec: 0 } },
  } }));
  await page.setViewportSize(duoViewports[3]);
  await page.goto('/mobile/#overview');
  await expect(page.getByText('All quiet here')).toBeVisible();
  await expect(page.getByText('Data served', { exact: true })).toBeVisible();
  await expect(page.getByText('Updates have not been checked.', { exact: true })).toBeVisible();
  const tiles = page.locator('[data-overview-section]');
  await expect(tiles).toHaveCount(4);
  for (const viewport of [duoViewports[3], { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport);
    const [streams, usenet, bandwidth, version] = await tiles.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
    expect([streams.y, bandwidth.y]).toEqual([usenet.y, version.y]);
    expect([streams.x, usenet.x]).toEqual([bandwidth.x, version.x]);
    expect(usenet.x).toBeGreaterThan(streams.right);
    expect(bandwidth.y - Math.max(streams.bottom, usenet.bottom)).toBe(24);
    const cardTops = await tiles.evaluateAll(nodes => nodes.map(node => node.querySelector('.card')?.getBoundingClientRect().top));
    expect(cardTops).toEqual([cardTops[0], cardTops[0], cardTops[2], cardTops[2]]);
    expect(cardTops.every(top => typeof top === 'number')).toBe(true);
  }
});

test('Duo resizing keeps Overview and Logs state while adapting both layouts', async ({ page }) => {
  const [outerPortrait, outerLandscape, innerPortrait] = duoViewports;
  await page.setViewportSize(outerPortrait);
  await page.goto('/mobile/#overview');
  const section = (id: string) => page.locator(`[data-overview-section="${id}"]`);
  await expect(section('warnings')).toBeVisible();
  expect((await section('system').boundingBox())!.x).toBe((await section('warnings').boundingBox())!.x);
  await page.getByRole('button', { name: 'Customize' }).click();
  await page.setViewportSize(innerPortrait);
  await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();
  const system = (await section('system').boundingBox())!;
  const warnings = (await section('warnings').boundingBox())!;
  expect(warnings.y).toBe(system.y);
  expect(warnings.x).toBeGreaterThan(system.x + system.width);
  expect((await section('streams').boundingBox())!.width).toBe((await section('bandwidth').boundingBox())!.width);
  expect((await section('streams').boundingBox())!.width).toBeGreaterThan(system.width + warnings.width);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Logs', exact: true }).click();
  const search = page.getByRole('searchbox', { name: 'Search logs' });
  await expect(page.locator('.log-row').first()).toBeVisible();
  const list = page.getByRole('region', { name: 'Log entries' });
  const distanceFromLatest = () => list.evaluate(el => el.scrollHeight - el.scrollTop - el.clientHeight);
  await expect.poll(distanceFromLatest).toBeLessThan(2);
  await page.setViewportSize(outerLandscape);
  await expect.poll(async () => (await list.boundingBox())!.height).toBeGreaterThan(112);
  await expect.poll(distanceFromLatest).toBeLessThan(2);
  await page.setViewportSize(outerPortrait);
  await search.fill('provider');
  await page.setViewportSize(outerLandscape);
  await expect(search).toHaveValue('provider');
  const filters = page.getByRole('button', { name: 'Log filters' });
  expect(Math.abs((await search.boundingBox())!.y - (await filters.boundingBox())!.y)).toBeLessThan(1);
  for (const control of [search, filters, page.getByRole('button', { name: 'Pause' }), page.getByRole('button', { name: 'Log actions' })]) {
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await filters.focus();
  await filters.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Log filters' });
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Close sheet' }).click();
  await expect(dialog).toBeHidden();
});

test('settings switches work with touch and keyboard and compact mode preserves grouped rows and log scrolling', async ({ page }) => {
  await page.goto('/mobile/#settings');
  const compact = page.getByLabel('Compact spacing');
  const motion = page.getByLabel('Reduce motion');
  await page.locator('label.toggle').filter({ hasText: 'Compact spacing' }).click();
  await expect(compact).toBeChecked();
  await motion.focus();
  await page.keyboard.press('Space');
  await expect(motion).toBeChecked();
  await expect(motion).toBeFocused();
  expect(await motion.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Preferences saved.' })).toBeVisible();
  await page.reload();
  await expect(compact).toBeChecked();
  await expect(motion).toBeChecked();
  await page.getByRole('link', { name: 'More', exact: true }).click();
  await expect(page.locator('.menu')).toHaveCSS('padding', '0px');
  await page.getByRole('link', { name: 'Logs', exact: true }).click();
  await expect(page.locator('.log-row').first()).toBeVisible();
  await expect(page.locator('.log-list')).toHaveCSS('padding', '0px');
  await expect(page.locator('.log-list')).toHaveCSS('overflow-y', 'auto');
  await page.getByRole('button', { name: /Log filters/ }).click();
  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('warn', { exact: true }).check();
  await sheet.getByRole('button', { name: 'Apply filters' }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('.log-row').first()).toContainText('warn');
});

test('secondary text, status colors, controls and input placeholders retain readable contrast', async ({ page }) => {
  await page.goto('/mobile/#settings');
  const samples = await page.evaluate(() => {
    const ratio = (a: string, b: string) => {
      const luminance = (color: string) => {
        const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(value => {
          const v = Number(value) / 255;
          return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
        });
        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
      };
      const x = luminance(a), y = luminance(b);
      return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
    };
    const root = getComputedStyle(document.documentElement);
    const results: { name: string; contrast: number }[] = [];
    for (const name of ['muted', 'blue', 'green', 'orange', 'red']) {
      const probe = document.createElement('span');
      probe.style.color = root.getPropertyValue(`--${name}`);
      probe.style.backgroundColor = root.getPropertyValue('--card');
      document.body.append(probe);
      const style = getComputedStyle(probe);
      results.push({ name, contrast: ratio(style.color, style.backgroundColor) });
      probe.remove();
    }
    const input = document.querySelector('input[type=url]')!;
    results.push({ name: 'placeholder', contrast: ratio(getComputedStyle(input, '::placeholder').color, getComputedStyle(input).backgroundColor) });
    const primary = getComputedStyle(document.querySelector('.primary')!);
    results.push({ name: 'primary button', contrast: ratio(primary.color, primary.backgroundColor) });
    return results;
  });
  for (const sample of samples) expect(sample.contrast, sample.name).toBeGreaterThanOrEqual(4.5);
});
