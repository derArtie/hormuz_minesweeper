// Gezielter Smoke-Test: Reveal auf sicherem Wasser, Zahlen, Schiff-Sichtbarkeit.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
mkdirSync('scripts/shots', { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(`${BASE}/minesweeper/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

// Klick mitten in den Persischen Golf (Label als Anker)
const label = page.locator('.map-label--water', { hasText: 'Persischer Golf' });
let lb = await label.boundingBox();
await page.mouse.click(lb.x + lb.width / 2, lb.y + lb.height / 2 + 30);
await page.waitForTimeout(1500);
await page.screenshot({ path: 'scripts/shots/10-revealed.png' });

// hineinzoomen auf die aufgedeckte Stelle, um Zahlen zu sehen
await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2 + 30);
for (let i = 0; i < 7; i++) {
  await page.mouse.wheel(0, -240);
  await page.waitForTimeout(100);
}
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/shots/11-revealed-zoom.png' });

// Patrouille: Schiff-Region screenshotten
await page.getByRole('button', { name: 'Patrouille' }).click();
await page.waitForTimeout(2600);
await page.screenshot({ path: 'scripts/shots/12-patrol-intro.png' });
await page.screenshot({
  path: 'scripts/shots/13-patrol-center.png',
  clip: { x: 1280 / 2 - 320, y: 800 / 2 - 220, width: 640, height: 440 },
});

console.log('CONSOLE ERRORS:', errors.length === 0 ? 'none' : errors.slice(0, 5).join('\n'));
await browser.close();
