// Prüft das neue Wasser-Glitzern (Spiel gezoomt + Landing, Tag und Nacht).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('scripts/shots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto('http://localhost:5173/minesweeper/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

const label = page.locator('.map-label--water', { hasText: 'Persischer Golf' });
const lb = await label.boundingBox();
await page.mouse.click(lb.x + lb.width / 2, lb.y + lb.height / 2 + 30);
await page.waitForTimeout(1200);
await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2 + 30);
for (let i = 0; i < 6; i++) {
  await page.mouse.wheel(0, -240);
  await page.waitForTimeout(90);
}
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/shots/70-water-night.png' });
await page.keyboard.press('n');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'scripts/shots/71-water-day.png' });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'scripts/shots/72-landing-water.png' });

console.log('ERRORS:', errors.length === 0 ? 'none' : errors.slice(0, 5).join('\n'));
await browser.close();
