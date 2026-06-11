import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { COLS, ROWS } from '../engine/map';

interface LabelDef {
  text: string;
  kind: 'land' | 'water';
  /** Gitterkoordinaten wie in v1 (Spalte, Zeile) */
  gx: number;
  gy: number;
  size: number;
}

const LABELS: LabelDef[] = [
  { text: 'Iran', kind: 'land', gx: 30, gy: 5, size: 16 },
  { text: 'Saudi-Arabien', kind: 'land', gx: 4, gy: 26, size: 13 },
  { text: 'Katar', kind: 'land', gx: 9, gy: 25, size: 12 },
  { text: 'VAE', kind: 'land', gx: 24, gy: 34, size: 13 },
  { text: 'Oman', kind: 'land', gx: 38, gy: 37, size: 13 },
  { text: 'Persischer Golf', kind: 'water', gx: 13, gy: 22, size: 13 },
  { text: 'Str. v. Hormuz', kind: 'water', gx: 35, gy: 20, size: 11 },
  { text: 'Golf von Oman', kind: 'water', gx: 50, gy: 27, size: 12 },
];

/** Im Raum verankerte Länder-/Gewässerbeschriftungen (CSS2D). */
export function createLabels(): THREE.Group {
  const group = new THREE.Group();
  for (const def of LABELS) {
    const el = document.createElement('div');
    el.className = `map-label map-label--${def.kind}`;
    el.style.fontSize = `${def.size}px`;
    el.textContent = def.text;
    const obj = new CSS2DObject(el);
    obj.position.set(def.gx - COLS / 2, def.kind === 'land' ? 1.6 : 0.3, def.gy - ROWS / 2);
    group.add(obj);
  }
  return group;
}
