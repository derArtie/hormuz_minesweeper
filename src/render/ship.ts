import * as THREE from 'three';
import type { Cell } from '../engine/types';
import { cellToWorld } from './cameraRig';

const SLIDE_SECONDS = 0.16;

function buildShipMesh(): THREE.Group {
  const ship = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#46586c', roughness: 0.6 });
  const deckMat = new THREE.MeshStandardMaterial({ color: '#8b9aab', roughness: 0.7 });
  const bridgeMat = new THREE.MeshStandardMaterial({ color: '#d8dde2', roughness: 0.65 });
  const funnelMat = new THREE.MeshStandardMaterial({ color: '#b3402a', roughness: 0.7 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.32), hullMat);
  hull.position.y = 0.1;

  const bow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 4), hullMat);
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  bow.position.set(0.52, 0.1, 0);
  bow.scale.z = 1.0;

  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.24), deckMat);
  deck.position.set(-0.02, 0.22, 0);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.2), bridgeMat);
  bridge.position.set(0.08, 0.33, 0);

  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.18, 6), funnelMat);
  funnel.position.set(-0.14, 0.36, 0);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), bridgeMat);
  mast.position.set(0.22, 0.42, 0);

  ship.add(hull, bow, deck, bridge, funnel, mast);
  ship.scale.setScalar(1.05);
  return ship;
}

/** Low-Poly-Patrouillenschiff: Slide-Animation, Schaukeln, Kielwasser-Hook. */
export class ShipView {
  readonly group = new THREE.Group();
  /** Wird während der Fahrt für Kielwasser-Partikel gerufen. */
  onWake: ((pos: THREE.Vector3) => void) | null = null;

  private readonly mesh: THREE.Group;
  private slide: { from: THREE.Vector3; to: THREE.Vector3; t: number } | null = null;
  private heading = 0;
  private targetHeading = 0;
  private wakeTimer = 0;

  constructor() {
    this.mesh = buildShipMesh();
    this.group.add(this.mesh);
    this.group.visible = false;
  }

  /** Schiff auf Zelle setzen; mit `animate` als sanfter Slide samt Drehung. */
  setCell(cell: Cell, animate: boolean): void {
    const to = cellToWorld(cell);
    if (!animate || !this.group.visible) {
      this.group.position.copy(to);
      this.slide = null;
      return;
    }
    const from = this.group.position.clone();
    this.slide = { from, to, t: 0 };
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    if (Math.abs(dx) + Math.abs(dz) > 0.01) this.targetHeading = Math.atan2(-dz, dx);
  }

  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  update(dt: number, time: number): void {
    if (!this.group.visible) return;

    if (this.slide) {
      this.slide.t = Math.min(1, this.slide.t + dt / SLIDE_SECONDS);
      const k = this.slide.t;
      const ease = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
      this.group.position.lerpVectors(this.slide.from, this.slide.to, ease);
      this.wakeTimer -= dt;
      if (this.wakeTimer <= 0 && this.onWake) {
        const stern = this.group.position.clone();
        stern.x -= Math.cos(this.heading) * 0.45;
        stern.z += Math.sin(this.heading) * 0.45;
        stern.y = 0.05;
        this.onWake(stern);
        this.wakeTimer = 0.04;
      }
      if (this.slide.t >= 1) this.slide = null;
    }

    // sanfte Drehung in Fahrtrichtung
    let delta = this.targetHeading - this.heading;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.heading += delta * Math.min(1, dt * 10);
    this.mesh.rotation.y = this.heading;

    // Schaukeln auf dem Wasser
    this.mesh.position.y = 0.04 + Math.sin(time * 1.7) * 0.025;
    this.mesh.rotation.z = Math.sin(time * 1.3) * 0.045;
    this.mesh.rotation.x = Math.cos(time * 1.1) * 0.03;
  }
}
