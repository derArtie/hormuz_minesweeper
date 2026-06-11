// Smoke-Test: lädt das Spiel headless in Edge, macht Screenshots und meldet Konsolenfehler.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
mkdirSync('scripts/shots', { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(`${BASE}/minesweeper/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'scripts/shots/01-classic-night.png' });

// Tag/Nacht umschalten
await page.keyboard.press('n');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'scripts/shots/02-classic-day.png' });
await page.keyboard.press('n');
await page.waitForTimeout(1800);

// Zelle in der Golfmitte aufdecken (Canvas-Klick)
const canvas = page.locator('#app canvas').first();
const box = await canvas.boundingBox();
await page.mouse.click(box.x + box.width * 0.42, box.y + box.height * 0.52);
await page.waitForTimeout(1200);
await page.screenshot({ path: 'scripts/shots/03-classic-revealed.png' });

// Flagge per Rechtsklick daneben
await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.45, { button: 'right' });
await page.waitForTimeout(400);
// Zoom
await page.mouse.move(box.x + box.width * 0.42, box.y + box.height * 0.52);
for (let i = 0; i < 5; i++) {
  await page.mouse.wheel(0, -240);
  await page.waitForTimeout(120);
}
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/shots/04-classic-zoomed.png' });

// Hilfe-Overlay
await page.keyboard.press('?');
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/shots/05-help.png' });
await page.keyboard.press('Escape');

// Patrouille-Modus
await page.getByRole('button', { name: 'Patrouille' }).click();
await page.waitForTimeout(2600);
await page.screenshot({ path: 'scripts/shots/06-patrol.png' });
// Schiff bewegen
for (const key of ['d', 'd', 'w', 'd']) {
  await page.keyboard.press(key);
  await page.waitForTimeout(250);
}
await page.screenshot({ path: 'scripts/shots/07-patrol-moved.png' });

console.log('CONSOLE ERRORS:', errors.length === 0 ? 'none' : '');
for (const e of errors) console.log(' -', e);
await browser.close();
