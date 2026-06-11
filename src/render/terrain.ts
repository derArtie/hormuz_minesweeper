import * as THREE from 'three';
import { COLS, ROWS, inBounds, isLand } from '../engine/map';

/** Deterministischer Jitter pro Gitterpunkt (kein RNG → Karte sieht immer gleich aus). */
function jitter(x: number, z: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** 4er-BFS: Abstand jeder Landzelle zur nächsten Wasserzelle (Küste = 1). */
function coastDistance(): number[][] {
  const dist: number[][] = Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(-1));
  const queue: [number, number][] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (!isLand[r][c]) {
        dist[r][c] = 0;
        queue.push([r, c]);
      }
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  return dist;
}

/** Zellhöhe: Wasser unter der Oberfläche, Land steigt zur Kartenmitte hin an. */
function cellHeight(r: number, c: number, dist: number[][]): number {
  const rr = Math.min(Math.max(r, 0), ROWS - 1);
  const cc = Math.min(Math.max(c, 0), COLS - 1);
  if (!isLand[rr][cc]) return -0.55;
  const d = dist[rr][cc];
  const base = 0.12 + Math.min(d, 6) * 0.22;
  return base + jitter(cc, rr) * 0.3;
}

function clampi(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Bilinear interpoliertes Value-Noise auf jitter() — sanfte Hügel statt Rauschen. */
function vnoise(x: number, z: number): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  return lerp(
    lerp(jitter(xi, zi), jitter(xi + 1, zi), u),
    lerp(jitter(xi, zi + 1), jitter(xi + 1, zi + 1), u),
    v,
  );
}

/** Zwei Oktaven gestapelt: große Bergzüge + feinere Struktur. */
function fbm(x: number, z: number): number {
  return vnoise(x * 0.16, z * 0.16) * 0.6 + vnoise(x * 0.42, z * 0.42) * 0.4;
}

/**
 * Höhe auch außerhalb der Karte. Statt die Randzelle endlos zu klonen (ergab
 * Plateaus mit Steilwänden und einen 1 Zelle breiten Wasser-„Kanal" in der
 * NO-Ecke) wird die Küste mit wachsendem Abstand verschmiert und in eine an
 * die echte Geografie angelehnte Umgebung übergeblendet: Zagros-Gebirge im
 * Norden (Iran), Dünen im Süden, Hadschar-Gebirge im Südosten (Oman),
 * offene See, wo die Karte mit Wasser endet.
 */
function extendedHeight(r: number, c: number, dist: number[][]): number {
  if (r >= 0 && r < ROWS && c >= 0 && c < COLS) return cellHeight(r, c, dist);
  const rr = clampi(r, 0, ROWS - 1);
  const cc = clampi(c, 0, COLS - 1);
  const out = Math.max(Math.abs(r - rr), Math.abs(c - cc));

  // Küstenlinie verschmieren: Mittel über eine mit dem Abstand wachsende
  // Nachbarschaft — schmale Wasserstreifen/Landzungen laufen nicht endlos weiter
  const s = Math.min(out, 9);
  let blurred = 0;
  for (const dr of [-s, 0, s])
    for (const dc of [-s, 0, s])
      blurred += cellHeight(clampi(rr + dr, 0, ROWS - 1), clampi(cc + dc, 0, COLS - 1), dist);
  blurred /= 9;
  let h = lerp(cellHeight(rr, cc, dist), blurred, Math.min(out / 4, 1));

  // Regionales Zielrelief, kontinuierlich über „Landigkeit" der Küste gemischt
  const n = fbm(c, r);
  const northT = r < 0 ? Math.min(-r / 9, 1) : 0;
  const southT = r >= ROWS ? Math.min((r - ROWS + 1) / 9, 1) : 0;
  const eastK = clampi((c - COLS * 0.55) / (COLS * 0.45), 0, 1);
  const zagros = northT * (1.4 + n * 2.8);
  const hajar = southT * eastK * (0.7 + n * 1.6);
  const landTarget = 0.45 + n * 0.55 + zagros + hajar;
  let ls = clampi((blurred + 0.35) / 0.5, 0, 1);
  ls = ls * ls * (3 - 2 * ls);
  const target = lerp(-0.7, landTarget, ls);

  return lerp(h, target, Math.min(out / 10, 1));
}

const SAND = new THREE.Color('#d8b888');
const DUNE = new THREE.Color('#c8a368');
const ROCK = new THREE.Color('#9d7f56');
const HIGH = new THREE.Color('#8f7a52');

function heightColor(h: number): THREE.Color {
  if (h < 0.3) return SAND;
  if (h < 0.7) return SAND.clone().lerp(DUNE, (h - 0.3) / 0.4);
  if (h < 1.2) return DUNE.clone().lerp(ROCK, (h - 0.7) / 0.5);
  return ROCK.clone().lerp(HIGH, Math.min(1, (h - 1.2) / 0.6));
}

/**
 * Low-Poly-Terrain: Heightmap-Plane über der ganzen Karte (+Rand), Eckpunkte
 * mitteln die Höhen der angrenzenden Zellen → sanfte Küsten, flat shading.
 */
export function createTerrain(): THREE.Mesh {
  const dist = coastDistance();
  const margin = 25;
  const segX = COLS + margin * 2;
  const segZ = ROWS + margin * 2;
  const geometry = new THREE.PlaneGeometry(segX, segZ, segX, segZ);
  geometry.rotateX(-Math.PI / 2);

  const pos = geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    // Gitterpunkt → Zellkoordinaten (Eckpunkt zwischen 4 Zellen)
    const gx = pos.getX(i) + COLS / 2;
    const gz = pos.getZ(i) + ROWS / 2;
    const c = Math.round(gx);
    const r = Math.round(gz);
    const h =
      (extendedHeight(r - 1, c - 1, dist) +
        extendedHeight(r - 1, c, dist) +
        extendedHeight(r, c - 1, dist) +
        extendedHeight(r, c, dist)) /
      4;
    pos.setY(i, h);
    color.copy(heightColor(h));
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 0.95,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = false;
  return mesh;
}
