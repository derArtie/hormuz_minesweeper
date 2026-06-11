// Mobile-Layout-Check: Smartphone-Viewport, Patrouille mit D-Pad.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('scripts/shots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto('http://localhost:5173/minesweeper/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.screenshot({ path: 'scripts/shots/30-mobile-classic.png' });

await page.getByRole('button', { name: 'Patrouille' }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: 'scripts/shots/31-mobile-patrol.png' });

console.log('ERRORS:', errors.length === 0 ? 'none' : errors.join('\n'));
await browser.close();
