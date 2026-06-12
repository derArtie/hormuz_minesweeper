import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { BoardView } from './boardView';
import { CameraRig } from './cameraRig';
import { DayNight } from './dayNight';
import { ConfettiOverlay, Effects } from './effects';
import { createLabels } from './labels';
import { SeaLife } from './seaLife';
import { ShipView } from './ship';
import { createTerrain } from './terrain';
import { createWater, type Water } from './water';

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null || canvas.getContext('webgl') !== null;
  } catch {
    return false;
  }
}

/**
 * Bündelt Renderer, Szene und alle Sicht-Komponenten; der Game-Loop läuft in
 * main.ts und ruft `update`/`render`.
 */
export class SceneRenderer {
  readonly scene = new THREE.Scene();
  readonly rig: CameraRig;
  readonly board: BoardView;
  readonly ship: ShipView;
  readonly effects: Effects;
  readonly confetti: ConfettiOverlay;
  readonly dayNight: DayNight;
  readonly seaLife: SeaLife;
  readonly canvas: HTMLCanvasElement;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly labelRenderer: CSS2DRenderer;
  private readonly water: Water;
  private readonly reducedMotion: boolean;
  private time = 0;

  constructor(
    private readonly container: HTMLElement,
    startDay: boolean,
  ) {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.canvas = this.renderer.domElement;
    container.appendChild(this.canvas);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'label-layer';
    container.appendChild(this.labelRenderer.domElement);

    this.rig = new CameraRig(1);

    this.water = createWater();
    if (this.reducedMotion) this.water.uniforms.uWaveAmp.value = 0.3;
    this.scene.add(this.water.mesh);
    this.scene.add(createTerrain());
    this.scene.add(createLabels());

    this.board = new BoardView();
    this.scene.add(this.board.group);

    this.ship = new ShipView();
    this.scene.add(this.ship.group);

    this.effects = new Effects();
    if (this.reducedMotion) this.effects.budget = 0.35;
    this.scene.add(this.effects.points, this.effects.flash);
    this.board.onSplash = (pos) => this.effects.spawnSplash(pos);
    this.ship.onWake = (pos) => this.effects.spawnWake(pos);

    this.seaLife = new SeaLife(() => this.rig.focus);
    this.seaLife.onSplash = (pos, power) => this.effects.spawnSplash(pos, power);
    this.scene.add(this.seaLife.group);

    this.confetti = new ConfettiOverlay(container);
    this.dayNight = new DayNight(this.scene, this.water, startDay);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Kamera-Shake, sofern Motion nicht reduziert ist. */
  shake(strength: number): void {
    if (!this.reducedMotion) this.rig.shake(strength);
  }

  celebrate(): void {
    if (!this.reducedMotion) this.confetti.burst();
  }

  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    this.rig.setAspect(w / h);
  }

  update(dt: number): void {
    this.time += dt;
    this.water.uniforms.uTime.value = this.time;
    this.rig.update(dt);
    this.board.update(dt, this.time);
    this.ship.update(dt, this.time);
    this.effects.update(dt);
    if (!this.reducedMotion) this.seaLife.update(dt);
    this.confetti.update(dt);
    this.dayNight.update(dt, this.time);
  }

  render(): void {
    this.renderer.render(this.scene, this.rig.camera);
    this.labelRenderer.render(this.scene, this.rig.camera);
  }
}
