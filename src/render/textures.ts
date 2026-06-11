import * as THREE from 'three';
import { NUMBER_COLORS } from './palette';

function textCanvas(text: string, color: string, fontScale: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.font = `700 ${size * fontScale}px 'JetBrains Mono', 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,10,25,0.85)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.fillText(text, size / 2, size / 2 + 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

const digitCache = new Map<number, THREE.CanvasTexture>();

/** Farbcodierte Ziffern-Textur (1–8), gecacht. */
export function digitTexture(digit: number): THREE.CanvasTexture {
  let tex = digitCache.get(digit);
  if (!tex) {
    tex = textCanvas(String(digit), NUMBER_COLORS[digit], 0.72);
    digitCache.set(digit, tex);
  }
  return tex;
}

export function glyphTexture(glyph: string, color: string): THREE.CanvasTexture {
  return textCanvas(glyph, color, 0.66);
}

const badgeCache = new Map<number, THREE.CanvasTexture>();

/** Ziffer auf dunklem Kreis — für die schwebende Zahl über dem Schiff. */
export function badgeTexture(digit: number): THREE.CanvasTexture {
  let tex = badgeCache.get(digit);
  if (!tex) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8, 16, 28, 0.82)';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(160, 200, 240, 0.5)';
    ctx.stroke();
    ctx.font = `700 ${size * 0.52}px 'JetBrains Mono', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = NUMBER_COLORS[digit];
    ctx.fillText(String(digit), size / 2, size / 2 + 3);
    tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    badgeCache.set(digit, tex);
  }
  return tex;
}
