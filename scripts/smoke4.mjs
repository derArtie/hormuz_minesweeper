// Prüft: Zahlen über Wellen, Schiffs-Badge mit Zahl, korrigierter Bug (Nahaufnahme).
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

// Klassisch: aufdecken + stark zoomen → Zahlen vs. Wellen
const label = page.locator('.map-label--water', { hasText: 'Persischer Golf' });
const lb = await label.boundingBox();
await page.mouse.click(lb.x + lb.width / 2, lb.y + lb.height / 2 + 30);
await page.waitForTimeout(1400);
await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2 + 30);
for (let i = 0; i < 9; i++) {
  await page.mouse.wheel(0, -240);
  await page.waitForTimeout(90);
}
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/shots/40-numbers-zoom.png' });

// Patrouille: bis neben eine Zahl fahren, Badge prüfen
await page.getByRole('button', { name: 'Patrouille' }).click();
await page.waitForTimeout(2500);
// dem sicheren Pfad ein Stück folgen, bis das Schiff auf einer Zahl steht
await page.evaluate(() => {
  const g = window.__hormuz.game();
  const path = g.safePath ?? [];
  for (let i = 1; i < path.length && i <= 14; i++) {
    g.moveShip(path[i].r - path[i - 1].r, path[i].c - path[i - 1].c);
    if (g.ship && g.board.count[g.ship.r][g.ship.c] > 0 && i > 4) break;
  }
});
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/shots/41-patrol-badge.png' });
// Nahaufnahme des Schiffs (Mitte, da Kamera folgt)
for (let i = 0; i < 6; i++) {
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, -240);
  await page.waitForTimeout(90);
}
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/shots/42-ship-closeup.png' });

console.log('ERRORS:', errors.length === 0 ? 'none' : errors.slice(0, 5).join('\n'));
await browser.close();
