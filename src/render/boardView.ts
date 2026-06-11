import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Game } from '../engine/game';
import { cellIndex, waterCells } from '../engine/map';
import type { Cell, Mark } from '../engine/types';
import { cellToWorld } from './cameraRig';
import { TILE_A, TILE_B, TILE_HOVER } from './palette';
import { digitTexture, glyphTexture } from './textures';

const TILE_TOP = 0.22;
const TILE_HEIGHT = 0.26;
const SINK_DEPTH = -0.75;
const SINK_SECONDS = 0.32;
const STAGGER = 0.011;
const MAX_STAGGER = 0.6;

const CAPACITY = waterCells.length;

/** InstancedMesh mit add/remove pro Zelle (Swap-with-last für Entfernen). */
class CellInstances {
  readonly mesh: THREE.InstancedMesh;
  private readonly cells: number[] = [];
  private readonly slotOf = new Map<number, number>();
  private readonly dummy = new THREE.Object3D();

  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    private readonly y: number,
    capacity = CAPACITY,
  ) {
    this.mesh = new THREE.InstancedMesh(geometry, material, capacity);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
  }

  has(cell: Cell): boolean {
    return this.slotOf.has(cellIndex(cell.r, cell.c));
  }

  add(cell: Cell, color?: THREE.Color): void {
    const key = cellIndex(cell.r, cell.c);
    if (this.slotOf.has(key)) return;
    const slot = this.cells.length;
    this.cells.push(key);
    this.slotOf.set(key, slot);
    const pos = cellToWorld(cell);
    this.dummy.position.set(pos.x, this.y, pos.z);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.scale.set(1, 1, 1);
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(slot, this.dummy.matrix);
    if (color) this.mesh.setColorAt(slot, color);
    this.mesh.count = this.cells.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  remove(cell: Cell): void {
    const key = cellIndex(cell.r, cell.c);
    const slot = this.slotOf.get(key);
    if (slot === undefined) return;
    const lastSlot = this.cells.length - 1;
    const lastKey = this.cells[lastSlot];
    if (slot !== lastSlot) {
      const m = new THREE.Matrix4();
      this.mesh.getMatrixAt(lastSlot, m);
      this.mesh.setMatrixAt(slot, m);
      if (this.mesh.instanceColor) {
        const c = new THREE.Color();
        this.mesh.getColorAt(lastSlot, c);
        this.mesh.setColorAt(slot, c);
      }
      this.cells[slot] = lastKey;
      this.slotOf.set(lastKey, slot);
    }
    this.cells.pop();
    this.slotOf.delete(key);
    this.mesh.count = this.cells.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  clear(): void {
    this.cells.length = 0;
    this.slotOf.clear();
    this.mesh.count = 0;
  }
}

function mineGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [new THREE.IcosahedronGeometry(0.24, 1)];
  const spike = () => new THREE.ConeGeometry(0.055, 0.16, 5);
  const dirs: [number, number, number][] = [
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0.7, 0.7, 0],
    [-0.7, 0.7, 0],
  ];
  const up = new THREE.Vector3(0, 1, 0);
  for (const [x, y, z] of dirs) {
    const dir = new THREE.Vector3(x, y, z).normalize();
    const g = spike();
    g.translate(0, 0.28, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir));
    // Icosahedron ist non-indexed → alle Teile angleichen, sonst schlägt der Merge fehl
    parts.push(g.toNonIndexed());
  }
  return mergeGeometries(parts);
}

interface SinkAnim {
  slot: number;
  cell: Cell;
  delay: number;
  t: number;
  splash: boolean;
}

/**
 * Darstellung des Spielfelds: erhabene Wasser-Tiles (unaufgedeckt), Sink-Animation
 * beim Aufdecken, Zahlen flach auf dem Wasser, Flaggen/Fragezeichen, Seeminen,
 * Zielzone (Patrouille) sowie Hover-/Tastaturfokus.
 */
export class BoardView {
  readonly group = new THREE.Group();
  /** Wird beim Versinken eines Tiles gerufen (für Wasserspritzer). */
  onSplash: ((pos: THREE.Vector3) => void) | null = null;

  private readonly tiles: THREE.InstancedMesh;
  private readonly slotByCell = new Map<number, number>();
  private readonly cellBySlot: Cell[] = [];
  private readonly tileUp: boolean[] = [];
  private anims: SinkAnim[] = [];
  private readonly dummy = new THREE.Object3D();

  private readonly digits: CellInstances[] = [];
  private readonly flagPoles: CellInstances;
  private readonly flagCloths: CellInstances;
  private readonly qmarks: CellInstances;
  private readonly mines: CellInstances;
  private readonly goal: CellInstances;
  private readonly goalMaterial: THREE.MeshBasicMaterial;

  private readonly hoverColor = new THREE.Color();
  private hoverSlot: number | null = null;
  private readonly focusRing: THREE.LineSegments;

  constructor() {
    // Unaufgedeckte Tiles
    const tileGeo = new THREE.BoxGeometry(0.94, TILE_HEIGHT, 0.94);
    const tileMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 });
    this.tiles = new THREE.InstancedMesh(tileGeo, tileMat, CAPACITY);
    this.tiles.frustumCulled = false;
    for (let i = 0; i < waterCells.length; i++) {
      const cell = waterCells[i];
      this.slotByCell.set(cellIndex(cell.r, cell.c), i);
      this.cellBySlot.push(cell);
      this.tileUp.push(true);
      this.tiles.setColorAt(i, (cell.r + cell.c) % 2 === 0 ? TILE_A : TILE_B);
    }
    this.group.add(this.tiles);

    // Zahlen 1–8 — über der maximalen Wellenhöhe, sonst verdeckt das Wasser die Ziffern
    const DIGIT_Y = 0.2;
    const digitGeo = new THREE.PlaneGeometry(0.8, 0.8);
    digitGeo.rotateX(-Math.PI / 2);
    this.digits.push(new CellInstances(digitGeo, new THREE.MeshBasicMaterial({ visible: false }), 0)); // Index 0 unbenutzt
    for (let d = 1; d <= 8; d++) {
      const mat = new THREE.MeshBasicMaterial({
        map: digitTexture(d),
        transparent: true,
        depthWrite: false,
      });
      const layer = new CellInstances(digitGeo, mat, DIGIT_Y);
      this.digits.push(layer);
      this.group.add(layer.mesh);
    }

    // Flaggen (Mast + Tuch als getrennte Instanz-Layer mit gleichen Zellen)
    const poleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 5);
    poleGeo.translate(-0.08, 0.27, 0);
    const poleMat = new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.6 });
    this.flagPoles = new CellInstances(poleGeo, poleMat, TILE_TOP);

    const clothGeo = new THREE.BufferGeometry();
    clothGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [-0.08, 0.52, 0, 0.26, 0.42, 0, -0.08, 0.32, 0],
        3,
      ),
    );
    clothGeo.computeVertexNormals();
    const clothMat = new THREE.MeshBasicMaterial({ color: '#e23a2e', side: THREE.DoubleSide });
    this.flagCloths = new CellInstances(clothGeo, clothMat, TILE_TOP);
    this.group.add(this.flagPoles.mesh, this.flagCloths.mesh);

    // Fragezeichen
    const qGeo = new THREE.PlaneGeometry(0.6, 0.6);
    qGeo.rotateX(-Math.PI / 2);
    this.qmarks = new CellInstances(
      qGeo,
      new THREE.MeshBasicMaterial({
        map: glyphTexture('?', '#f0c040'),
        transparent: true,
        depthWrite: false,
      }),
      TILE_TOP + 0.02,
    );
    this.group.add(this.qmarks.mesh);

    // Seeminen
    const mineMat = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.45 });
    this.mines = new CellInstances(mineGeometry(), mineMat, 0.16);
    this.group.add(this.mines.mesh);

    // Zielzone (Patrouille): pulsierende goldene Plättchen über den Tiles
    const goalGeo = new THREE.PlaneGeometry(0.96, 0.96);
    goalGeo.rotateX(-Math.PI / 2);
    this.goalMaterial = new THREE.MeshBasicMaterial({
      color: '#ffc62e',
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.goal = new CellInstances(goalGeo, this.goalMaterial, TILE_TOP + 0.045);
    this.group.add(this.goal.mesh);

    // Tastatur-Fokusring
    const ringGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.0, TILE_HEIGHT + 0.1, 1.0));
    this.focusRing = new THREE.LineSegments(
      ringGeo,
      new THREE.LineBasicMaterial({ color: '#ffe632' }),
    );
    this.focusRing.visible = false;
    this.group.add(this.focusRing);

    this.resetTiles();
  }

  private setTileMatrix(slot: number, sink: number): void {
    const cell = this.cellBySlot[slot];
    const pos = cellToWorld(cell);
    const y = THREE.MathUtils.lerp(TILE_TOP - TILE_HEIGHT / 2, SINK_DEPTH, sink);
    const s = THREE.MathUtils.lerp(1, 0.55, sink);
    this.dummy.position.set(pos.x, y, pos.z);
    this.dummy.scale.set(s, 1, s);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.updateMatrix();
    this.tiles.setMatrixAt(slot, this.dummy.matrix);
  }

  private hideTile(slot: number): void {
    this.dummy.position.set(0, -50, 0);
    this.dummy.scale.setScalar(0.0001);
    this.dummy.updateMatrix();
    this.tiles.setMatrixAt(slot, this.dummy.matrix);
  }

  private resetTiles(): void {
    for (let slot = 0; slot < this.cellBySlot.length; slot++) {
      this.setTileMatrix(slot, 0);
      this.tileUp[slot] = true;
    }
    this.tiles.count = this.cellBySlot.length;
    this.tiles.instanceMatrix.needsUpdate = true;
  }

  /** Setzt die Darstellung für ein frisches Spiel zurück. */
  reset(game: Game): void {
    this.anims = [];
    this.resetTiles();
    for (const layer of this.digits) layer.clear();
    this.flagPoles.clear();
    this.flagCloths.clear();
    this.qmarks.clear();
    this.mines.clear();
    this.goal.clear();
    this.setHover(null);
    this.setFocus(null);

    if (game.mode === 'patrol') {
      for (const cell of game.goalCells()) this.goal.add(cell);
      if (game.ship) this.revealInstant(game.ship, game.board.count[game.ship.r][game.ship.c]);
    }
  }

  private revealInstant(cell: Cell, count: number): void {
    const slot = this.slotByCell.get(cellIndex(cell.r, cell.c));
    if (slot === undefined || !this.tileUp[slot]) return;
    this.tileUp[slot] = false;
    this.hideTile(slot);
    this.tiles.instanceMatrix.needsUpdate = true;
    if (count > 0 && count <= 8) this.digits[count].add(cell);
  }

  /** Aufdecken mit Sink-Animation (gestaffelt in Flood-Fill-Reihenfolge). */
  revealCells(cells: Cell[], counts: number[][], animate: boolean): void {
    if (!animate) {
      for (const cell of cells) this.revealInstant(cell, counts[cell.r][cell.c]);
      return;
    }
    let i = 0;
    for (const cell of cells) {
      const slot = this.slotByCell.get(cellIndex(cell.r, cell.c));
      if (slot === undefined || !this.tileUp[slot]) continue;
      this.tileUp[slot] = false;
      this.anims.push({
        slot,
        cell,
        delay: Math.min(i * STAGGER, MAX_STAGGER),
        t: 0,
        splash: i < 24, // Partikel-Budget
      });
      i++;
    }
  }

  /** Mine an Zelle anzeigen; `hit` = getroffene (rote) Mine. */
  showMine(cell: Cell, hit: boolean): void {
    this.revealInstant(cell, 0);
    this.mines.add(cell, hit ? new THREE.Color('#ff4422') : new THREE.Color('#4a545e'));
  }

  setMark(cell: Cell, mark: Mark): void {
    this.flagPoles.remove(cell);
    this.flagCloths.remove(cell);
    this.qmarks.remove(cell);
    if (mark === 'flag') {
      this.flagPoles.add(cell);
      this.flagCloths.add(cell);
    } else if (mark === 'qmark') {
      this.qmarks.add(cell);
    }
  }

  setHover(cell: Cell | null): void {
    if (this.hoverSlot !== null) {
      const prev = this.cellBySlot[this.hoverSlot];
      this.tiles.setColorAt(this.hoverSlot, (prev.r + prev.c) % 2 === 0 ? TILE_A : TILE_B);
      this.hoverSlot = null;
    }
    if (cell) {
      const slot = this.slotByCell.get(cellIndex(cell.r, cell.c));
      if (slot !== undefined && this.tileUp[slot]) {
        this.hoverColor.copy(TILE_HOVER);
        this.tiles.setColorAt(slot, this.hoverColor);
        this.hoverSlot = slot;
      }
    }
    if (this.tiles.instanceColor) this.tiles.instanceColor.needsUpdate = true;
  }

  setFocus(cell: Cell | null): void {
    if (!cell) {
      this.focusRing.visible = false;
      return;
    }
    const pos = cellToWorld(cell);
    this.focusRing.position.set(pos.x, TILE_TOP - TILE_HEIGHT / 2 + 0.02, pos.z);
    this.focusRing.visible = true;
  }

  update(dt: number, time: number): void {
    if (this.anims.length > 0) {
      let dirty = false;
      const done: SinkAnim[] = [];
      for (const anim of this.anims) {
        if (anim.delay > 0) {
          anim.delay -= dt;
          if (anim.delay > 0) continue;
        }
        if (anim.t === 0 && anim.splash && this.onSplash) {
          const pos = cellToWorld(anim.cell);
          pos.y = TILE_TOP;
          this.onSplash(pos);
        }
        anim.t = Math.min(1, anim.t + dt / SINK_SECONDS);
        this.setTileMatrix(anim.slot, anim.t * anim.t);
        dirty = true;
        if (anim.t >= 1) done.push(anim);
      }
      if (done.length > 0) {
        for (const anim of done) {
          this.hideTile(anim.slot);
          const { r, c } = anim.cell;
          const count = this.pendingCounts?.[r]?.[c] ?? 0;
          if (count > 0 && count <= 8) this.digits[count].add(anim.cell);
        }
        this.anims = this.anims.filter((a) => !done.includes(a));
        dirty = true;
      }
      if (dirty) this.tiles.instanceMatrix.needsUpdate = true;
    }
    this.goalMaterial.opacity = 0.28 + 0.14 * Math.sin(time * 2.4);
  }

  /** Zahlenfeld des aktuellen Spiels (für verzögertes Einblenden nach der Animation). */
  pendingCounts: number[][] | null = null;
}
