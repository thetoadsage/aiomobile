import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('capture current README screens with synthetic data', async ({ page, context }) => {
  test.setTimeout(60000);
  await context.request.get('/fixture/login');
  await page.clock.install({ time: 1791043200000 });
  await page.goto('/mobile/');
  await page.setViewportSize({ width: 390, height: 844 });
  await mkdir('docs/screenshots/readme', { recursive: true });
  for (const [name, route, theme] of [
    ['overview', 'overview', 'sage'], ['streams', 'streams', 'sage'],
    ['usenet', 'usenet', 'sage'], ['logs', 'logs', 'sage'],
    ['settings', 'settings', 'paper'], ['history', 'history', 'sage'],
    ['recorded-activity', 'usenet', 'paper'], ['server-version', 'overview', 'sage'],
  ]) {
    await page.evaluate(theme => localStorage.setItem('aiomobile.preferences', JSON.stringify({ theme, reducedMotion: true })), theme);
    await page.goto(`/mobile/#${route}`);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.skeletons')).toHaveCount(0);
    await page.waitForTimeout(3200);
    if (name === 'overview') await expect(page.locator('.summary-reading strong').first()).toHaveText('2');
    if (name === 'recorded-activity') await page.locator('.usenet-history').evaluate(node => window.scrollTo(0, node.getBoundingClientRect().top + scrollY - 70));
    if (name === 'server-version') {
      await page.locator('.server-version').getByText('Build & updates', { exact: true }).click();
      await page.locator('.server-version').scrollIntoViewIfNeeded();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `docs/screenshots/readme/${name}.png`, scale: 'css' });
  }
});
