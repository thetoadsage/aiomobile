// Render installation icons from the same Flow geometry as the themed React mark.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
const root = new URL('../', import.meta.url);
const mark = JSON.parse(await readFile(new URL('src/assets/brand-mark.json', root), 'utf8'));
const background = '#101716', accent = '#b3dd8c';
const paths = mark.paths.map(path => `<path d="${path.d}" fill="none" stroke="${accent}" stroke-width="${path.width}" stroke-linecap="round"/>`).join('');
const svg = (size, maskable = false, rounded = false) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${mark.viewBox}"><rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="${background}"/><g${maskable ? ' transform="translate(6.4 6.4) scale(.8)"' : ''}>${paths}</g></svg>`;
await writeFile(new URL('public/icons/icon.svg', root), svg(512, false, true) + '\n');
const browser = await chromium.launch();
try {
  for (const [size, name, maskable] of [[180, 'apple-touch-icon', false], [192, 'icon-192', false], [512, 'icon-512', false], [512, 'maskable-512', true]]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:${background}">${svg(size, maskable)}</body></html>`);
    await page.screenshot({ path: fileURLToPath(new URL(`public/icons/${name}.png`, root)) });
    await page.close();
  }
} finally { await browser.close(); }
console.log('Generated Flow installation icons in Sage from shared geometry.');
