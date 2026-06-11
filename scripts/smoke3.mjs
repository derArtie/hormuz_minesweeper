// End-Flow-Test: Sieg (Overlay, Meme, Bestzeiten, Konfetti) und Niederlage (Minen, Explosion).
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
await page.waitForTimeout(2000);

// Klassisch gewinnen
await page.evaluate(() => window.__hormuz.winNow());
await page.waitForTimeout(700);
await page.screenshot({ path: 'scripts/shots/20-win-overlay.png' });

// Neue Mission über den Button, dann verlieren
await page.getByRole('button', { name: 'Neue Mission' }).click();
await page.waitForTimeout(1200);
await page.evaluate(() => window.__hormuz.loseNow());
await page.waitForTimeout(500);
await page.screenshot({ path: 'scripts/shots/21-loss-explosion.png' });
await page.waitForTimeout(1300);
await page.screenshot({ path: 'scripts/shots/22-loss-overlay.png' });

// Patrouille gewinnen (über sicheren Pfad)
await page.keyboard.press('Escape');
await page.getByRole('button', { name: 'Neue Mission' }).click();
await page.waitForTimeout(400);
await page.locator('header').getByRole('button', { name: 'Patrouille' }).click();
await page.waitForTimeout(2400);
await page.evaluate(() => window.__hormuz.winNow());
await page.waitForTimeout(800);
await page.screenshot({ path: 'scripts/shots/23-patrol-win.png' });

console.log('CONSOLE ERRORS:', errors.length === 0 ? 'none' : errors.slice(0, 8).join('\n'));
await browser.close();
