import { test, expect, type Page } from '@playwright/test';
import { history, liveStreams } from '../fixtures';

test.beforeEach(async ({ context }) => { await context.request.get('/fixture/login'); });

async function openTransferSettings(page: Page) {
  await page.getByRole('link', { name: 'More', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Stream settings/ })).toHaveCount(0);
  await page.getByRole('button', { name: /^Settings/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');
  await expect(page.getByRole('link', { name: 'More', exact: true })).toHaveAttribute('aria-current', 'page');
}

function historyRows(total: number, tiny: number) {
  return Array.from({ length: total }, (_, i) => ({ ...history[0], id: `history-${i}`, filename: `Episode.${i}.mkv`, bytesServed: i < tiny ? 4096 : 65536 }));
}

test('saved visibility governs live cards, Overview count and history; crossing the threshold reveals a paused session', async ({ page }) => {
  let amount = 4096;
  const writes: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/') && request.method() !== 'GET') writes.push(request.url()); });
  await page.route('**/live/stream', route => route.abort());
  await page.route('**/streams/live', route => route.fulfill({ json: { success: true, data: { ...liveStreams, streams: [liveStreams.streams[0], { ...liveStreams.streams[1], bytesServed: amount, activity: 'paused', bytesPerSec: 0 }] } } }));
  await page.route('**/streams/history?*', route => {
    const url = new URL(route.request().url());
    const rows = historyRows(2, 1);
    const offset = Number(url.searchParams.get('offset'));
    const limit = Number(url.searchParams.get('limit'));
    return route.fulfill({ json: { success: true, data: { entries: rows.slice(offset, offset + limit), total: rows.length } } });
  });
  await page.goto('/mobile/#streams');
  const toggle = page.getByRole('checkbox', { name: 'Show all transfers' });
  await expect(toggle).toHaveCount(0);
  await expect(page.locator('.stream-card')).toHaveCount(1);
  await expect(page.locator('.history-card h3')).toHaveText(['Episode.1.mkv']);
  await openTransferSettings(page);
  await expect(toggle).not.toBeChecked();
  await page.getByText('Advanced settings', {exact:true}).click();
  const baseDraft = page.getByLabel('AIOStreams base URL');
  await baseDraft.fill('https://draft.example.test');
  await toggle.check();
  await expect(baseDraft).toHaveValue('https://draft.example.test');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('aiomobile.preferences')!).baseUrl)).toBe('');
  await baseDraft.fill('');
  await page.getByRole('checkbox', {name:'Compact spacing'}).check();
  await page.getByRole('button', {name:'Save preferences',exact:true}).click();
  await expect(page.locator('.app')).toHaveClass(/compact/);
  await page.reload(); await expect(toggle).toBeChecked();
  await page.getByRole('button', {name:'Back',exact:true}).click();
  await expect(page.getByRole('heading', {level:1})).toHaveText('More');
  await page.getByRole('link', { name: 'Streams', exact: true }).click();
  await expect(toggle).toHaveCount(0);
  await expect(page.locator('.stream-card')).toHaveCount(2);
  await expect(page.locator('.history-card')).toHaveCount(2);
  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page.locator('.summary-reading strong').first()).toHaveText('2');
  await openTransferSettings(page); await toggle.uncheck();
  await page.getByRole('link', { name: 'Streams', exact: true }).click();
  const refresh = () => Promise.all([page.waitForResponse(response => response.url().endsWith('/streams/live')), page.getByRole('button', { name: 'Refresh dashboard' }).click()]);
  amount = 65535; await refresh();
  await expect(page.locator('.stream-card')).toHaveCount(1);
  amount = 65536; await refresh();
  await expect(page.locator('.stream-card')).toHaveCount(2);
  await expect(page.locator('.stream-card').last()).toContainText('paused');
  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page.locator('.summary-reading strong').first()).toHaveText('2');
  amount = 4096; await refresh();
  await expect(page.locator('.summary-reading strong').first()).toHaveText('1');
  await expect(page.locator('.stream-card')).toHaveCount(1);
  expect(writes).toEqual([]);
});

test('filtered history fills pages across probes and preserves sorting and search', async ({ page }) => {
  await page.route('**/streams/history?*', route => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q') || '';
    const rows = historyRows(165, 120).filter(row => row.filename.includes(q));
    const offset = Number(url.searchParams.get('offset'));
    const limit = Number(url.searchParams.get('limit'));
    expect(url.searchParams.has('_cursor')).toBe(false);
    return route.fulfill({ json: { success: true, data: { entries: rows.slice(offset, offset + limit), total: rows.length } } });
  });
  await page.goto('/mobile/#streams');
  await expect(page.locator('.history-card')).toHaveCount(20);
  await expect(page.locator('.history-card h3').first()).toHaveText('Episode.120.mkv');
  await expect(page.locator('.stream-history')).toContainText('120 tiny transfers hidden in 140 checked records.');
  await expect(page.locator('.stream-history')).not.toContainText('of 165');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.history-card h3').first()).toHaveText('Episode.140.mkv');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.history-card')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.locator('.history-card h3').first()).toHaveText('Episode.140.mkv');
  await page.getByLabel('Sort history').selectOption('oldest');
  await expect(page.locator('.history-card h3').first()).toHaveText('Episode.164.mkv');
  await page.getByLabel('Search filename').fill('Episode.130.');
  await expect(page.locator('.history-card h3')).toHaveText(['Episode.130.mkv']);
  await expect(page.locator('.pagination')).toContainText('Page 1');
});

test('long runs of tiny transfers stay bounded and can be continued or revealed', async ({ page }) => {
  let calls = 0;
  await page.route('**/streams/history?*', route => {
    calls++;
    const url = new URL(route.request().url());
    const rows = historyRows(601, 600);
    const offset = Number(url.searchParams.get('offset'));
    const limit = Number(url.searchParams.get('limit'));
    return route.fulfill({ json: { success: true, data: { entries: rows.slice(offset, offset + limit), total: rows.length } } });
  });
  await page.goto('/mobile/#streams');
  await expect(page.getByText('No larger transfers in these records')).toBeVisible();
  expect(calls).toBe(5);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('.history-card h3')).toHaveText(['Episode.600.mkv']);
  await openTransferSettings(page);
  await page.getByRole('checkbox', { name: 'Show all transfers' }).check();
  await page.getByRole('link', { name: 'Streams', exact: true }).click();
  await expect(page.locator('.history-card')).toHaveCount(20);
  await expect(page.locator('.pagination')).toContainText('1–20 of 601');
});

test('storage failure keeps the toggle usable for the current visit', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage blocked'); }; });
  await page.goto('/mobile/#more');
  await openTransferSettings(page);
  await page.getByRole('checkbox', { name: 'Show all transfers' }).check();
  await expect(page.getByRole('checkbox', { name: 'Show all transfers' })).toBeChecked();
  await expect(page.getByText('This preference applies for this visit. Browser storage is unavailable.')).toBeVisible();
});

test('Streams section in Settings fits narrow phones and desktop in Sage and Paper', async ({ page }, testInfo) => {
  await page.goto('/mobile/#streams');
  for (const [width, theme] of [[320, 'sage'], [390, 'paper'], [1280, 'sage']] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(theme => localStorage.setItem('aiomobile.preferences', JSON.stringify({ theme })), theme);
    await page.goto('/mobile/#streams');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('.history-card')).toHaveCount(20);
    await expect(page.getByRole('checkbox', {name:'Show all transfers'})).toHaveCount(0);
    await openTransferSettings(page);
    await expect(page.getByRole('heading', {name:'Streams',exact:true})).toBeVisible();
    const control = page.getByRole('checkbox', {name:'Show all transfers'}).locator('..');
    await control.scrollIntoViewIfNeeded();
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (testInfo.project.name === 'webkit') await page.screenshot({ path: `.impeccable/review/settings-transfer-toggle/${width}-${theme}.png`, scale: 'css' });
  }
});
