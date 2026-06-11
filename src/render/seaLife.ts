import * as THREE from 'three';
import { COLS, ROWS, isLand, isPlayable } from '../engine/map';
import type { Cell } from '../engine/types';

/**
 * Ambient-Meeresleben: springende Fischschwärme, Delfin-Gruppen und selten
 * ein auftauchender Wal. Events spawnen nur auf offenem Wasser — aufgedeckte
 * Zellen plus die See-Zufahrten außerhalb der Karte — nie unter Kacheln oder
 * auf Land. Abgetauchte Körper verschwinden unter der opaken Wasserfläche.
 */

const Y_WATER = 0;

function cellKey(r: number, c: number): string {
  return r + ',' + c;
}

function cellToWorld(r: number, c: number): THREE.Vector3 {
  return new THREE.Vector3(c - COLS / 2 + 0.5, 0, r - ROWS / 2 + 0.5);
}

/** See-Bänder vor den offenen Kartenkanten (nur Run-Inneres, sicher Wasser). */
function baseOpenCells(): Cell[] {
  const open = (r: number, c: number) =>
    r >= 0 && r < ROWS && c >= 0 && c < COLS && !isLand[r][c] && isPlayable[r][c];
  const cells: Cell[] = [];
  for (let r = 0; r < ROWS; r++) {
    if (open(r, 0) && open(r - 1, 0) && open(r + 1, 0))
      for (let c = -7; c <= -1; c++) cells.push({ r, c });
    if (open(r, COLS - 1) && open(r - 1, COLS - 1) && open(r + 1, COLS - 1))
      for (let c = COLS; c <= COLS + 6; c++) cells.push({ r, c });
  }
  for (let c = 0; c < COLS; c++)
    if (open(ROWS - 1, c) && open(ROWS - 1, c - 1) && open(ROWS - 1, c + 1))
      for (let r = ROWS; r <= ROWS + 6; r++) cells.push({ r, c });
  return cells;
}

// ── Meshes (Low-Poly, Vorwärtsrichtung = +Z) ─────────────────────────────

function fishMesh(): THREE.Mesh {
  const geo = new THREE.ConeGeometry(0.05, 0.22, 5);
  geo.rotateX(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: '#b8ccd8',
    roughness: 0.4,
    metalness: 0.35,
    flatShading: true,
  });
  return new THREE.Mesh(geo, mat);
}

function dolphinMesh(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#7d93a4', roughness: 0.55, flatShading: true });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 7, 6), mat);
  body.scale.set(0.5, 0.45, 1.25);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4), mat);
  fin.position.set(0, 0.15, -0.05);
  fin.rotation.x = -0.45;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), mat);
  nose.geometry.rotateX(Math.PI / 2);
  nose.position.set(0, 0, 0.4);
  g.add(body, fin, nose);
  return g;
}

function whaleMesh(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#42505c', roughness: 0.7, flatShading: true });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 9, 7), mat);
  body.scale.set(0.85, 0.7, 2.1);
  const hump = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 4), mat);
  hump.position.set(0, 0.42, -0.35);
  const flukeGeo = new THREE.ConeGeometry(0.3, 0.55, 4);
  flukeGeo.rotateX(Math.PI / 2);
  for (const side of [-1, 1]) {
    const fluke = new THREE.Mesh(flukeGeo, mat);
    fluke.scale.set(1, 0.18, 1);
    fluke.position.set(side * 0.22, 0.05, -1.35);
    fluke.rotation.y = side * 0.75 + Math.PI;
    g.add(fluke);
  }
  g.add(body, hump);
  return g;
}

// ── Events ───────────────────────────────────────────────────────────────

type Splash = (pos: THREE.Vector3, power?: number) => void;

interface SeaEvent {
  readonly group: THREE.Group;
  /** false sobald das Event vorbei ist */
  update(dt: number): boolean;
}

class FishSchool implements SeaEvent {
  readonly group = new THREE.Group();
  private t = 0;
  private readonly fish: {
    mesh: THREE.Mesh;
    from: THREE.Vector3;
    delay: number;
    splashed: [boolean, boolean];
  }[] = [];
  private readonly dir: THREE.Vector3;
  private readonly dur = 0.85;
  private readonly len = 1.3;

  constructor(
    center: THREE.Vector3,
    private readonly splash: Splash,
  ) {
    this.dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    const perp = new THREE.Vector3(-this.dir.z, 0, this.dir.x);
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const mesh = fishMesh();
      mesh.visible = false;
      this.group.add(mesh);
      this.fish.push({
        mesh,
        from: center
          .clone()
          .addScaledVector(perp, (Math.random() - 0.5) * 0.7)
          .addScaledVector(this.dir, (Math.random() - 0.5) * 0.5 - this.len / 2),
        delay: i * 0.2 + Math.random() * 0.12,
        splashed: [false, false],
      });
    }
  }

  private pos(f: (typeof this.fish)[number], k: number, out: THREE.Vector3): THREE.Vector3 {
    out.copy(f.from).addScaledVector(this.dir, this.len * k);
    out.y = Y_WATER - 0.35 + 1.0 * Math.sin(Math.PI * k);
    return out;
  }

  update(dt: number): boolean {
    this.t += dt;
    const p = new THREE.Vector3();
    const next = new THREE.Vector3();
    let alive = false;
    for (const f of this.fish) {
      const k = (this.t - f.delay) / this.dur;
      if (k < 0) {
        alive = true;
        continue;
      }
      if (k > 1) {
        f.mesh.visible = false;
        continue;
      }
      alive = true;
      f.mesh.visible = true;
      f.mesh.position.copy(this.pos(f, k, p));
      f.mesh.lookAt(this.pos(f, k + 0.02, next));
      if (!f.splashed[0] && k > 0.1) {
        f.splashed[0] = true;
        this.splash(new THREE.Vector3(p.x, Y_WATER, p.z), 0.5);
      }
      if (!f.splashed[1] && k > 0.88) {
        f.splashed[1] = true;
        this.splash(new THREE.Vector3(p.x, Y_WATER, p.z), 0.5);
      }
    }
    return alive;
  }
}

class DolphinPod implements SeaEvent {
  readonly group = new THREE.Group();
  private t = 0;
  private readonly speed = 1.9;
  private readonly pod: {
    mesh: THREE.Group;
    lag: number;
    side: number;
    phase: number;
    prevY: number;
  }[] = [];

  constructor(
    private readonly start: THREE.Vector3,
    private readonly dir: THREE.Vector3,
    private readonly len: number,
    private readonly splash: Splash,
  ) {
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const mesh = dolphinMesh();
      this.group.add(mesh);
      this.pod.push({
        mesh,
        lag: i * 0.7 + Math.random() * 0.2,
        side: (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * 0.5,
        phase: Math.random() * 0.8,
        prevY: -1,
      });
    }
  }

  private pos(d: (typeof this.pod)[number], s: number, out: THREE.Vector3): THREE.Vector3 {
    const perp = new THREE.Vector3(-this.dir.z, 0, this.dir.x);
    out.copy(this.start).addScaledVector(this.dir, s).addScaledVector(perp, d.side);
    // Porpoising: Bogen alle ~3.2 Einheiten, dazwischen unter Wasser;
    // hinter dem Pfadende tauchen sie ab und bleiben unten
    out.y = Y_WATER - 0.2 + 0.62 * Math.sin(((s + d.phase) * Math.PI * 2) / 3.2);
    if (s > this.len) out.y -= (s - this.len) * 1.2;
    return out;
  }

  update(dt: number): boolean {
    this.t += dt;
    const p = new THREE.Vector3();
    const next = new THREE.Vector3();
    let alive = false;
    for (const d of this.pod) {
      const s = this.speed * this.t - d.lag;
      if (s < this.len + 2) alive = true;
      if (s < 0) continue;
      d.mesh.position.copy(this.pos(d, s, p));
      d.mesh.lookAt(this.pos(d, s + 0.05, next));
      if ((d.prevY < Y_WATER) !== (p.y < Y_WATER))
        this.splash(new THREE.Vector3(p.x, Y_WATER, p.z), 0.8);
      d.prevY = p.y;
    }
    return alive;
  }
}

class Whale implements SeaEvent {
  readonly group = new THREE.Group();
  private t = 0;
  private readonly mesh: THREE.Group;
  private spouted = false;
  private tailSplashed = false;

  constructor(
    private readonly center: THREE.Vector3,
    private readonly dir: THREE.Vector3,
    private readonly splash: Splash,
  ) {
    this.mesh = whaleMesh();
    this.group.add(this.mesh);
  }

  update(dt: number): boolean {
    this.t += dt;
    const t = this.t;
    const m = this.mesh;
    const drift = 0.18;
    m.position.copy(this.center).addScaledVector(this.dir, t * drift);

    if (t < 1.6) {
      // Auftauchen
      const k = THREE.MathUtils.smoothstep(t / 1.6, 0, 1);
      m.position.y = THREE.MathUtils.lerp(-2.4, -0.14, k);
      m.lookAt(m.position.clone().add(this.dir));
    } else if (t < 4.8) {
      // An der Oberfläche: leicht wogen, einmal blasen
      m.position.y = -0.14 + Math.sin(t * 1.3) * 0.05;
      m.lookAt(m.position.clone().add(this.dir));
      if (!this.spouted && t > 2.1) {
        this.spouted = true;
        const blowhole = m.position.clone().addScaledVector(this.dir, 0.7);
        blowhole.y = 0.45;
        this.splash(blowhole, 2.2);
      }
    } else {
      // Abtauchen: Nase nach unten, Fluke schlägt einmal
      const k = Math.min(1, (t - 4.8) / 2.2);
      m.position.y = THREE.MathUtils.lerp(-0.14, -2.8, k * k);
      const target = m.position
        .clone()
        .add(this.dir)
        .add(new THREE.Vector3(0, -k * 1.4, 0));
      m.lookAt(target);
      if (!this.tailSplashed && k > 0.25) {
        this.tailSplashed = true;
        const tail = m.position.clone().addScaledVector(this.dir, -1.2);
        tail.y = Y_WATER;
        this.splash(tail, 2.6);
      }
    }
    return t < 7.2;
  }
}

// ── Orchestrierung ───────────────────────────────────────────────────────

export class SeaLife {
  readonly group = new THREE.Group();
  /** Spritzer-Callback (Effects.spawnSplash). */
  onSplash: Splash = () => {};

  private readonly base: Cell[];
  private readonly open = new Set<string>();
  private openList: Cell[] = [];
  private listDirty = true;
  private active: SeaEvent | null = null;
  private nextIn = 5 + Math.random() * 5;
  private lastWasWhale = false;

  constructor(private readonly getFocus: () => THREE.Vector3) {
    this.base = baseOpenCells();
    this.reset();
  }

  /** Neues Spiel: nur die See-Bänder bleiben offen. */
  reset(): void {
    this.open.clear();
    for (const { r, c } of this.base) this.open.add(cellKey(r, c));
    this.listDirty = true;
    if (this.active) this.group.remove(this.active.group);
    this.active = null;
    this.nextIn = 5 + Math.random() * 5;
  }

  /** Aufgedeckte Zellen werden Spawn-Kandidaten. */
  addOpen(cells: readonly Cell[]): void {
    for (const { r, c } of cells) this.open.add(cellKey(r, c));
    this.listDirty = true;
  }

  private isOpen(r: number, c: number): boolean {
    return this.open.has(cellKey(r, c));
  }

  private candidates(): Cell[] {
    if (this.listDirty) {
      this.openList = [...this.open].map((k) => {
        const [r, c] = k.split(',').map(Number);
        return { r, c };
      });
      this.listDirty = false;
    }
    return this.openList;
  }

  /** Kandidat in Kameranähe (sonst irgendwo) — Events sollen sichtbar sein. */
  private pickCell(filter?: (cell: Cell) => boolean): Cell | null {
    const focus = this.getFocus();
    const all = this.candidates();
    const pool = all.filter((cell) => {
      if (filter && !filter(cell)) return false;
      const w = cellToWorld(cell.r, cell.c);
      return (w.x - focus.x) ** 2 + (w.z - focus.z) ** 2 < 16 * 16;
    });
    const list = pool.length > 0 ? pool : filter ? all.filter(filter) : all;
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  private hasOpenRing(cell: Cell): boolean {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) if (!this.isOpen(cell.r + dr, cell.c + dc)) return false;
    return true;
  }

  /** Freie Bahn der Länge len ab Zelle in eine der 8 Richtungen suchen. */
  private findRun(len: number): { start: THREE.Vector3; dir: THREE.Vector3 } | null {
    const dirs: [number, number][] = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (let attempt = 0; attempt < 14; attempt++) {
      const cell = this.pickCell();
      if (!cell) return null;
      const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
      const norm = Math.hypot(dr, dc);
      let ok = true;
      for (let step = 0; step <= len; step++) {
        const r = cell.r + Math.round((dr / norm) * step);
        const c = cell.c + Math.round((dc / norm) * step);
        if (!this.isOpen(r, c)) {
          ok = false;
          break;
        }
      }
      if (ok)
        return {
          start: cellToWorld(cell.r, cell.c),
          dir: new THREE.Vector3(dc / norm, 0, dr / norm),
        };
    }
    return null;
  }

  private spawn(): SeaEvent | null {
    const roll = Math.random();
    if (roll < 0.14 && !this.lastWasWhale) {
      const cell = this.pickCell((c) => this.hasOpenRing(c));
      if (cell) {
        this.lastWasWhale = true;
        const dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        return new Whale(cellToWorld(cell.r, cell.c), dir, this.onSplash);
      }
    }
    this.lastWasWhale = false;
    if (roll < 0.5) {
      const run = this.findRun(7);
      if (run) return new DolphinPod(run.start, run.dir, 7, this.onSplash);
    }
    const cell = this.pickCell();
    return cell ? new FishSchool(cellToWorld(cell.r, cell.c), this.onSplash) : null;
  }

  update(dt: number): void {
    if (this.active) {
      if (!this.active.update(dt)) {
        this.group.remove(this.active.group);
        this.active = null;
        this.nextIn = 10 + Math.random() * 12;
      }
      return;
    }
    this.nextIn -= dt;
    if (this.nextIn <= 0) {
      this.active = this.spawn();
      if (this.active) this.group.add(this.active.group);
      else this.nextIn = 8;
    }
  }
}
