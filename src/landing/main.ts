import './landing.css';
import { HeroScene } from './heroScene';

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null;
  } catch {
    return false;
  }
}

// ── 3D-Hero ────────────────────────────────────────────────────────────
const heroBg = document.getElementById('hero-bg')!;
let scene: HeroScene | null = null;
if (webglAvailable()) {
  try {
    scene = new HeroScene(heroBg);
  } catch {
    scene = null;
  }
}
if (!scene) heroBg.classList.add('no-webgl');

const onScroll = () => {
  const p = window.scrollY / window.innerHeight;
  scene?.setScroll(p);
  heroBg.style.opacity = String(Math.max(0, 1 - p * 0.85));
  document.body.classList.toggle('scrolled', p > 0.06);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

if (scene) {
  const hero = scene;
  let last = performance.now();
  const loop = (ts: number) => {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (ts - last) / 1000);
    last = ts;
    if (!hero.active) return; // außerhalb des Heros nicht rendern
    hero.update(dt);
    hero.render();
  };
  requestAnimationFrame(loop);
}

// ── Scroll-Reveal für Inhaltskarten ────────────────────────────────────
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
);
for (const el of document.querySelectorAll('.reveal')) observer.observe(el);

// ── Count-up der Minenzahlen beim Einblenden ───────────────────────────
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const countObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      countObserver.unobserve(entry.target);
      const el = entry.target as HTMLElement;
      const target = Number(el.dataset.count ?? '0');
      if (reduced || target <= 0) {
        el.textContent = String(target);
        continue;
      }
      const start = performance.now();
      const duration = 900;
      const tick = (ts: number) => {
        const t = Math.min(1, (ts - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  },
  { threshold: 0.4 },
);
for (const el of document.querySelectorAll('[data-count]')) countObserver.observe(el);
