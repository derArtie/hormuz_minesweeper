// Landing-Page-Check: Hero-Szene, Scroll-Reveal, Count-up, Mobile.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('scripts/shots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2800);
await page.screenshot({ path: 'scripts/shots/50-landing-hero.png' });

// kurz warten auf einen möglichen Blitz-Moment
await page.waitForTimeout(3500);
await page.screenshot({ path: 'scripts/shots/51-landing-hero2.png' });

// scrollen → Reveal + Count-up
await page.mouse.wheel(0, 1200);
await page.waitForTimeout(900);
await page.screenshot({ path: 'scripts/shots/52-landing-scrolled.png' });
await page.mouse.wheel(0, 1400);
await page.waitForTimeout(1200);
await page.screenshot({ path: 'scripts/shots/53-landing-diff.png' });

// Mobile-Viewport
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await mobile.waitForTimeout(2500);
await mobile.screenshot({ path: 'scripts/shots/54-landing-mobile.png' });

console.log('ERRORS:', errors.length === 0 ? 'none' : errors.slice(0, 5).join('\n'));
await browser.close();
