import * as THREE from 'three';
import { COLS, ROWS, inBounds } from '../engine/map';
import type { Cell } from '../engine/types';

const ZOOM_MIN = 1;
const ZOOM_MAX = 5;
const ELEVATION = THREE.MathUtils.degToRad(58); // geneigte Top-Down-Perspektive
const FOV = 42;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface FlyAnim {
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromZoom: number;
  toZoom: number;
  t: number;
  duration: number;
}

/**
 * Kamera mit Isometric-Feeling: schaut aus Süden geneigt auf die Karte.
 * Zoom = 1 zeigt die ganze Karte; Pan/Zoom mit weichem Damping und Clamping.
 */
export class CameraRig {
  readonly camera: THREE.PerspectiveCamera;

  private target = new THREE.Vector3(0, 0, 0);
  private desiredTarget = new THREE.Vector3(0, 0, 0);
  private zoom = ZOOM_MIN;
  private desiredZoom = ZOOM_MIN;
  private fitDistance = 50;
  private followCell: Cell | null = null;
  private fly: FlyAnim | null = null;
  private shakeAmp = 0;
  private readonly shakeOffset = new THREE.Vector3();
  private readonly raycaster = new THREE.Raycaster();
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(FOV, aspect, 0.5, 400);
    this.setAspect(aspect);
    this.apply(true);
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const halfFov = THREE.MathUtils.degToRad(FOV / 2);
    // Distanz, bei der die ganze Karte (mit etwas Rand) sichtbar ist
    const fitV = ((ROWS / 2 + 5) / Math.tan(halfFov)) * Math.sin(ELEVATION);
    const fitH = (COLS / 2 + 4) / (Math.tan(halfFov) * aspect);
    this.fitDistance = Math.max(fitV, fitH);
  }

  get currentZoom(): number {
    return this.zoom;
  }

  private get distance(): number {
    return this.fitDistance / this.zoom;
  }

  /** Pan in Bildschirmpixeln → Weltverschiebung auf der Wasserebene. */
  panBy(dxPx: number, dyPx: number, viewportHeight: number): void {
    if (this.fly) return;
    const worldPerPixel =
      (2 * this.distance * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / viewportHeight;
    this.desiredTarget.x -= dxPx * worldPerPixel;
    this.desiredTarget.z -= (dyPx * worldPerPixel) / Math.sin(ELEVATION);
    this.clampTarget(this.desiredTarget);
    this.followCell = null;
  }

  /** Zoom um einen Faktor; hält den Weltpunkt unter dem Cursor stabil. */
  zoomBy(factor: number, pivot?: THREE.Vector3): void {
    if (this.fly) return;
    const oldZoom = this.desiredZoom;
    this.desiredZoom = THREE.MathUtils.clamp(this.desiredZoom * factor, ZOOM_MIN, ZOOM_MAX);
    if (pivot) {
      const scale = oldZoom / this.desiredZoom;
      this.desiredTarget.lerpVectors(pivot, this.desiredTarget, scale);
      this.clampTarget(this.desiredTarget);
    }
  }

  /** Kamera folgt einer Zelle (Patrouille). */
  follow(cell: Cell | null): void {
    this.followCell = cell;
  }

  /** Sanfter Flug zu Zelle + Zoomstufe (Patrouille-Intro). */
  flyTo(cell: Cell, zoom: number, duration: number): void {
    const to = cellToWorld(cell);
    this.clampToMap(to);
    this.fly = {
      fromTarget: this.target.clone(),
      toTarget: to,
      fromZoom: this.zoom,
      toZoom: zoom,
      t: 0,
      duration,
    };
  }

  resetView(): void {
    this.fly = null;
    this.followCell = null;
    this.zoom = this.desiredZoom = ZOOM_MIN;
    this.target.set(0, 0, 0);
    this.desiredTarget.set(0, 0, 0);
    this.apply(true);
  }

  shake(strength: number): void {
    this.shakeAmp = Math.max(this.shakeAmp, strength);
  }

  update(dt: number): void {
    if (this.fly) {
      this.fly.t += dt / this.fly.duration;
      const k = easeInOutCubic(Math.min(1, this.fly.t));
      this.target.lerpVectors(this.fly.fromTarget, this.fly.toTarget, k);
      this.zoom = THREE.MathUtils.lerp(this.fly.fromZoom, this.fly.toZoom, k);
      this.desiredTarget.copy(this.target);
      this.desiredZoom = this.zoom;
      if (this.fly.t >= 1) this.fly = null;
    } else {
      if (this.followCell && this.desiredZoom > 1.05) {
        // Schiff immer im Bild halten: nur auf die Kartenränder clampen,
        // nicht auf den zoomabhängigen Pan-Bereich (Start liegt am Rand)
        this.desiredTarget.copy(cellToWorld(this.followCell));
        this.clampToMap(this.desiredTarget);
      }
      const k = 1 - Math.exp(-dt * 10);
      this.target.lerp(this.desiredTarget, k);
      this.zoom = THREE.MathUtils.lerp(this.zoom, this.desiredZoom, k);
    }

    if (this.shakeAmp > 0.001) {
      this.shakeOffset.set(
        (Math.random() - 0.5) * this.shakeAmp,
        (Math.random() - 0.5) * this.shakeAmp * 0.4,
        (Math.random() - 0.5) * this.shakeAmp,
      );
      this.shakeAmp *= Math.exp(-dt * 7);
    } else {
      this.shakeOffset.set(0, 0, 0);
    }
    this.apply();
  }

  /** Bildschirmkoordinaten → Zelle auf der Wasserebene (oder null). */
  pickCell(clientX: number, clientY: number, element: HTMLElement): Cell | null {
    const point = this.pickPoint(clientX, clientY, element);
    if (!point) return null;
    const c = Math.floor(point.x + COLS / 2);
    const r = Math.floor(point.z + ROWS / 2);
    return inBounds(r, c) ? { r, c } : null;
  }

  pickPoint(clientX: number, clientY: number, element: HTMLElement): THREE.Vector3 | null {
    const rect = element.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const point = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, point);
  }

  private clampTarget(v: THREE.Vector3): void {
    this.clampTargetForZoom(v, this.desiredZoom);
  }

  private clampTargetForZoom(v: THREE.Vector3, zoom: number): void {
    const f = 1 - 1 / zoom;
    v.x = THREE.MathUtils.clamp(v.x, (-COLS / 2) * f, (COLS / 2) * f);
    v.z = THREE.MathUtils.clamp(v.z, (-ROWS / 2) * f, (ROWS / 2) * f);
    v.y = 0;
  }

  private clampToMap(v: THREE.Vector3): void {
    v.x = THREE.MathUtils.clamp(v.x, -COLS / 2 + 3, COLS / 2 - 3);
    v.z = THREE.MathUtils.clamp(v.z, -ROWS / 2 + 3, ROWS / 2 - 3);
    v.y = 0;
  }

  private apply(immediate = false): void {
    if (immediate) {
      this.target.copy(this.desiredTarget);
      this.zoom = this.desiredZoom;
    }
    const d = this.distance;
    this.camera.position.set(
      this.target.x + this.shakeOffset.x,
      this.target.y + Math.sin(ELEVATION) * d + this.shakeOffset.y,
      this.target.z + Math.cos(ELEVATION) * d + this.shakeOffset.z,
    );
    this.camera.lookAt(this.target);
  }
}

/** Zellkoordinate → Weltposition (Zellmitte auf der Wasserebene). */
export function cellToWorld(cell: Cell): THREE.Vector3 {
  return new THREE.Vector3(cell.c - COLS / 2 + 0.5, 0, cell.r - ROWS / 2 + 0.5);
}
