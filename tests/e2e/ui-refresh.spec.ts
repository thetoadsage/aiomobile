import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test.beforeEach(async ({ context }) => { await context.request.get('/fixture/login'); });

const routes = ['overview', 'streams', 'stream/stream-1', 'usenet', 'provider/p1', 'logs', 'indexers', 'history', 'settings', 'more'];
const headings: Record<string, string> = {
  overview: 'Overview', streams: 'Streams', 'stream/stream-1': 'The.Expanse.S01E01.2160p.mkv',
  usenet: 'Usenet', 'provider/p1': 'Primary provider', logs: 'Logs', indexers: 'Indexers',
  history: 'History & bandwidth', settings: 'Settings', more: 'More',
};

test('all screens fit small phones, landscape, tablets and desktop without clipped values', async ({ page, browserName }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  if (browserName === 'chromium') await mkdir('docs/screenshots/ui-refresh', { recursive: true });
  for (const viewport of [{ width: 320, height: 690 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1280, height: 900 }]) {
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
        expect(list!.height).toBeGreaterThan(viewport.width === 844 ? 100 : 50);
        expect(list!.y + list!.height).toBeLessThanOrEqual(bar!.y);
      }
      if (browserName === 'chromium' && (viewport.width === 1280 && ['overview', 'history', 'settings', 'logs'].includes(route) || viewport.width === 390 && route === 'more' || viewport.width === 844 && route === 'logs')) {
        await page.screenshot({ path: `docs/screenshots/ui-refresh/${route}-${viewport.width}.png` });
      }
    }
  }
  expect(errors).toEqual([]);
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
