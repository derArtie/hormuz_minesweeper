import * as THREE from 'three';
import type { Cell } from '../engine/types';
import { cellToWorld } from './cameraRig';
import { badgeTexture } from './textures';

const SLIDE_SECONDS = 0.16;
const BADGE_POP_SECONDS = 0.28;

/** Low-Poly-Patrouillenschiff (Spitze zeigt +X) — auch für die Landing Page. */
export function buildShipMesh(): THREE.Group {
  const ship = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#5d728a', roughness: 0.6 });
  const deckMat = new THREE.MeshStandardMaterial({ color: '#8b9aab', roughness: 0.7 });
  const bridgeMat = new THREE.MeshStandardMaterial({ color: '#d8dde2', roughness: 0.65 });
  const funnelMat = new THREE.MeshStandardMaterial({ color: '#b3402a', roughness: 0.7 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.32), hullMat);
  hull.position.y = 0.1;

  // Bug: 4-seitiger Kegel, Transformationen in die Geometrie gebacken —
  // Querschnitt an den Rumpf angepasst (0.16 hoch, 0.32 breit), Spitze zeigt +X
  const bowGeo = new THREE.ConeGeometry(0.16, 0.3, 4);
  bowGeo.rotateY(Math.PI / 4); // Diamant-Querschnitt → achsparallele Flächen
  bowGeo.rotateZ(-Math.PI / 2); // Spitze nach +X
  bowGeo.scale(1, 0.16 / 0.226, 0.32 / 0.226);
  bowGeo.translate(0.53, 0.1, 0);
  const bow = new THREE.Mesh(bowGeo, hullMat);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.24), deckMat);
  deck.position.set(-0.02, 0.22, 0);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.2), bridgeMat);
  bridge.position.set(0.08, 0.33, 0);

  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.18, 6), funnelMat);
  funnel.position.set(-0.14, 0.36, 0);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), bridgeMat);
  mast.position.set(0.22, 0.42, 0);

  // Navigationslicht: macht das Schiff auch nachts gut sichtbar
  const lampMat = new THREE.MeshStandardMaterial({
    color: '#ffe9a8',
    emissive: new THREE.Color('#ffcf5e'),
    emissiveIntensity: 2.2,
  });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), lampMat);
  lamp.position.set(0.22, 0.58, 0);
  const lampLight = new THREE.PointLight('#ffd47a', 1.6, 4, 2);
  lampLight.position.set(0.22, 0.7, 0);

  // Detail-Pass: Wasserlinie, Brückenfenster, Schornsteinkappe, Radar,
  // Buggeschütz, Rettungsinseln und Heckaufbau
  const darkMat = new THREE.MeshStandardMaterial({ color: '#2e3a47', roughness: 0.7 });
  const waterline = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.335), darkMat);
  waterline.position.y = 0.045;

  const windowMat = new THREE.MeshStandardMaterial({
    color: '#16222e',
    roughness: 0.25,
    metalness: 0.4,
  });
  const windows = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.17), windowMat);
  windows.position.set(0.175, 0.365, 0);

  const funnelCap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 6), darkMat);
  funnelCap.position.set(-0.14, 0.455, 0);

  const radar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.018, 0.12), bridgeMat);
  radar.position.set(0.22, 0.53, 0);

  const gunBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.06, 7), deckMat);
  gunBase.position.set(0.33, 0.21, 0);
  const turret = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.06), bridgeMat);
  turret.position.set(0.33, 0.255, 0);
  const barrelGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.14, 5);
  barrelGeo.rotateZ(-Math.PI / 2); // Lauf zeigt +X
  barrelGeo.translate(0.42, 0.27, 0);
  const barrel = new THREE.Mesh(barrelGeo, darkMat);

  const boatGeo = new THREE.CapsuleGeometry(0.022, 0.07, 3, 6);
  boatGeo.rotateZ(Math.PI / 2); // längs zur Fahrtrichtung
  const boatMat = new THREE.MeshStandardMaterial({ color: '#c8743c', roughness: 0.8 });
  for (const side of [-1, 1]) {
    const boat = new THREE.Mesh(boatGeo, boatMat);
    boat.position.set(-0.08, 0.285, side * 0.135);
    ship.add(boat);
  }

  const stern = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.16), deckMat);
  stern.position.set(-0.3, 0.215, 0);

  ship.add(
    hull, bow, deck, bridge, funnel, mast, lamp, lampLight,
    waterline, windows, funnelCap, radar, gunBase, turret, barrel, stern,
  );
  ship.scale.setScalar(1.3);
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

  /** Zahl der Zelle unter dem Schiff, schwebend über dem Mast (Pop-Animation). */
  private readonly badge: THREE.Sprite;
  private readonly badgeMaterial: THREE.SpriteMaterial;
  private badgeDigit = 0;
  private badgePop = 1;

  constructor() {
    this.mesh = buildShipMesh();
    this.group.add(this.mesh);
    this.group.visible = false;

    this.badgeMaterial = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
    this.badge = new THREE.Sprite(this.badgeMaterial);
    this.badge.position.set(0, 1.15, 0);
    this.badge.renderOrder = 10;
    this.badge.visible = false;
    this.group.add(this.badge);
  }

  /** Zeigt die Minenzahl der Zelle unter dem Schiff (0/aus → ausblenden). */
  setNumber(digit: number | null): void {
    const d = digit ?? 0;
    if (d === this.badgeDigit) return;
    this.badgeDigit = d;
    if (d <= 0 || d > 8) {
      this.badge.visible = false;
      return;
    }
    this.badgeMaterial.map = badgeTexture(d);
    this.badgeMaterial.needsUpdate = true;
    this.badge.visible = true;
    this.badgePop = 0;
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

    // Zahl über dem Schiff: federnder Pop beim Einblenden + sanftes Schweben
    if (this.badge.visible) {
      this.badgePop = Math.min(1, this.badgePop + dt / BADGE_POP_SECONDS);
      const t = this.badgePop;
      const overshoot = 1 + 0.45 * Math.sin(t * Math.PI) * (1 - t); // 0 → ~1.2 → 1
      const scale = 0.72 * t * overshoot;
      this.badge.scale.set(scale, scale, 1);
      this.badge.position.y = 1.15 + Math.sin(time * 1.9) * 0.04;
      this.badgeMaterial.opacity = Math.min(1, t * 1.6);
    }
  }
}
