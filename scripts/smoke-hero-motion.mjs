// Beobachtet die Schiffsbewegung über ~40 s (Zeitraffer-Screenshots).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('scripts/shots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
for (let i = 0; i < 5; i++) {
  await page.screenshot({ path: `scripts/shots/6${i}-hero-t${i * 9}.png` });
  if (i < 4) await page.waitForTimeout(9000);
}
console.log('ERRORS:', errors.length === 0 ? 'none' : errors.join('\n'));
await browser.close();
