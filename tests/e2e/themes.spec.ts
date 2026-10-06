import { test, expect } from '@playwright/test';
import { themes } from '../../src/lib/themes';
test.beforeEach(async ({ context }) => { await context.request.get('/fixture/login'); });

test('all palettes persist, cover every screen, and retain readable semantic colors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 740 });
  for (const theme of themes) {
    await page.goto('/mobile/#settings');
    await page.getByRole('radio', { name: new RegExp(`^${theme.name}`) }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
    await page.reload();
    await expect(page.getByRole('radio', { name: new RegExp(`^${theme.name}`) })).toBeChecked();
    await expect(page.locator('html')).toHaveCSS('color-scheme', theme.scheme);
    const colors = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const luminance = (token: string) => {
        ctx.fillStyle = root.getPropertyValue(token).trim();ctx.fillRect(0, 0, 1, 1);
        const channels = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map(channel => {
          const c = channel / 255;return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
        });
        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
      };
      const pairs = [
        ['--text','--card'], ['--muted','--card'], ['--muted','--background'], ['--muted','--hero'],
        ['--accent','--card'], ['--accent','--hero'], ['--accent','--accent-soft'], ['--on-accent','--accent'],
        ['--green','--green-soft'], ['--orange','--orange-soft'], ['--red','--red-soft'],
        ['--green','--card'], ['--orange','--card'], ['--red','--card'], ['--muted','--surface-inset'],
      ];
      return pairs.map(([foreground, background]) => {
        const a = luminance(foreground), b = luminance(background);
        return { pair: `${foreground} on ${background}`, ratio: (Math.max(a,b)+.05)/(Math.min(a,b)+.05) };
      });
    });
    for (const sample of colors) expect(sample.ratio, `${theme.name}: ${sample.pair}`).toBeGreaterThanOrEqual(4.5);
    for (const route of ['overview', 'streams', 'stream/stream-1', 'usenet', 'provider/p1', 'history', 'indexers', 'logs', 'more', 'settings']) {
      await page.goto(`/mobile/#${route}`);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.skeletons')).toHaveCount(0);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.evaluate(() => document.querySelector('meta[name="theme-color"]')?.getAttribute('content') === getComputedStyle(document.documentElement).getPropertyValue('--background').trim())).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('device appearance updates live while explicit themes remain unchanged', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/mobile/#settings');
  await page.getByRole('radio', { name: /Use device appearance/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sage');
  await page.reload();
  await expect(page.getByRole('radio', { name: /Use device appearance/ })).toBeChecked();
  await page.getByRole('radio', { name: /^Ember/ }).check();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ember');
});

test('theme changes leave unsaved connection drafts and live feeds alone', async ({ page }) => {
  const outgoing: string[] = [];
  await page.goto('/mobile/#settings');
  await expect(page.locator('.topbar .connection')).toHaveText('Live');
  page.on('request', request => outgoing.push(request.url()));
  await page.locator('.advanced-settings > summary').click();
  await page.getByLabel('AIOStreams base URL').fill('https://example.test');
  await page.getByRole('radio', { name: /^Paper/ }).check();
  await expect(page.getByLabel('AIOStreams base URL')).toHaveValue('https://example.test');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('aiomobile.preferences')!))).toMatchObject({ baseUrl: '', theme: 'paper' });
  expect(outgoing.some(url => url.includes('example.test') || url.includes('/live/stream'))).toBe(false);
  await page.getByLabel('AIOStreams base URL').fill('');
  await page.getByRole('button', { name: 'Save preferences' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
});

test('picker supports keyboard navigation and reports storage failures without claiming success', async ({ page }) => {
  await page.goto('/mobile/#settings');
  const sage = page.getByRole('radio', { name: /^Sage/ });
  await sage.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: /^Midnight/ })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Blocked'); }; });
  await page.locator('.theme-choice').filter({ hasText: 'Glacier' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save the theme');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight');
  await expect(page.getByText('Theme saved.', { exact: true })).toHaveCount(0);
});
