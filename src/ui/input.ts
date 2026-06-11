import type { Cell } from '../engine/types';
import type { CameraRig } from '../render/cameraRig';

const DRAG_THRESHOLD_PX = 6;
const LONG_PRESS_MS = 500;
const WHEEL_ZOOM_FACTOR = 1.15;

export interface InputCallbacks {
  /** Linksklick / Tap: aufdecken bzw. Chord. */
  onPrimary(cell: Cell): void;
  /** Rechtsklick / Long-Press: Markierung. */
  onSecondary(cell: Cell): void;
  onHover(cell: Cell | null): void;
  /** Beliebige Maus-/Touch-Eingabe (versteckt Tastatur-Fokus und Hints). */
  onPointerActivity(): void;
}

/** Maus-, Wheel- und Touch-Steuerung der 3D-Szene (Pick, Pan, Pinch-Zoom). */
export class InputController {
  private pointerDown: { x: number; y: number; button: number } | null = null;
  private panning = false;
  private lastX = 0;
  private lastY = 0;

  private touch: {
    mode: 'tap' | 'pan' | 'pinch';
    x: number;
    y: number;
    startX: number;
    startY: number;
    dist: number;
    moved: boolean;
    longPressFired: boolean;
    longPress: number;
  } | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly rig: CameraRig,
    private readonly cb: InputCallbacks,
  ) {
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    canvas.addEventListener('pointerleave', () => cb.onHover(null));
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const cell = this.rig.pickCell(e.clientX, e.clientY, this.canvas);
      if (cell) cb.onSecondary(cell);
    });
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const pivot = this.rig.pickPoint(e.clientX, e.clientY, this.canvas);
        this.rig.zoomBy(e.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR, pivot ?? undefined);
      },
      { passive: false },
    );

    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    canvas.addEventListener('touchcancel', () => this.cancelTouch());
  }

  // ── Maus ───────────────────────────────────────────────────────────────

  private onPointerDown(e: PointerEvent): void {
    if (e.pointerType !== 'mouse') return;
    this.cb.onPointerActivity();
    if (e.button === 1) e.preventDefault();
    this.pointerDown = { x: e.clientX, y: e.clientY, button: e.button };
    this.panning = false;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  private onPointerMove(e: PointerEvent): void {
    if (e.pointerType !== 'mouse') return;
    this.cb.onPointerActivity();
    if (this.pointerDown) {
      const canPan =
        this.pointerDown.button === 1 ||
        (this.pointerDown.button === 0 && this.rig.currentZoom > 1.05);
      const dist = Math.hypot(e.clientX - this.pointerDown.x, e.clientY - this.pointerDown.y);
      if (canPan && (this.panning || dist > DRAG_THRESHOLD_PX)) {
        this.panning = true;
        this.rig.panBy(e.clientX - this.lastX, e.clientY - this.lastY, this.canvas.clientHeight);
        this.canvas.style.cursor = 'grabbing';
      }
    }
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.cb.onHover(this.rig.pickCell(e.clientX, e.clientY, this.canvas));
  }

  private onPointerUp(e: PointerEvent): void {
    if (e.pointerType !== 'mouse' || !this.pointerDown) return;
    const wasPanning = this.panning;
    const button = this.pointerDown.button;
    this.pointerDown = null;
    this.panning = false;
    this.canvas.style.cursor = '';
    if (!wasPanning && button === 0 && e.target === this.canvas) {
      const cell = this.rig.pickCell(e.clientX, e.clientY, this.canvas);
      if (cell) this.cb.onPrimary(cell);
    }
  }

  // ── Touch ──────────────────────────────────────────────────────────────

  private onTouchStart(e: TouchEvent): void {
    this.cb.onPointerActivity();
    if (e.touches.length === 2) {
      e.preventDefault();
      this.clearLongPress();
      const [a, b] = [e.touches[0], e.touches[1]];
      this.touch = {
        mode: 'pinch',
        x: (a.clientX + b.clientX) / 2,
        y: (a.clientY + b.clientY) / 2,
        startX: 0,
        startY: 0,
        dist: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
        moved: true,
        longPressFired: false,
        longPress: 0,
      };
      return;
    }
    const t = e.touches[0];
    const touch = {
      mode: 'tap' as const,
      x: t.clientX,
      y: t.clientY,
      startX: t.clientX,
      startY: t.clientY,
      dist: 0,
      moved: false,
      longPressFired: false,
      longPress: 0,
    };
    touch.longPress = window.setTimeout(() => {
      if (this.touch === touch && !touch.moved) {
        touch.longPressFired = true;
        const cell = this.rig.pickCell(touch.startX, touch.startY, this.canvas);
        if (cell) this.cb.onSecondary(cell);
      }
    }, LONG_PRESS_MS);
    this.touch = touch;
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.touch) return;
    if (this.touch.mode === 'pinch' && e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      const pivot = this.rig.pickPoint(cx, cy, this.canvas);
      this.rig.zoomBy(dist / this.touch.dist, pivot ?? undefined);
      this.rig.panBy(cx - this.touch.x, cy - this.touch.y, this.canvas.clientHeight);
      this.touch.dist = dist;
      this.touch.x = cx;
      this.touch.y = cy;
      return;
    }
    const t = e.touches[0];
    const total = Math.hypot(t.clientX - this.touch.startX, t.clientY - this.touch.startY);
    if (total > 8) {
      this.touch.moved = true;
      this.clearLongPress();
      if (this.rig.currentZoom > 1.05) {
        this.rig.panBy(t.clientX - this.touch.x, t.clientY - this.touch.y, this.canvas.clientHeight);
      }
    }
    this.touch.x = t.clientX;
    this.touch.y = t.clientY;
  }

  private onTouchEnd(e: TouchEvent): void {
    if (!this.touch) return;
    this.clearLongPress();
    if (e.touches.length > 0) return; // weiterer Finger noch unten
    const { mode, moved, longPressFired, startX, startY } = this.touch;
    this.touch = null;
    if (mode === 'tap' && !moved && !longPressFired) {
      const cell = this.rig.pickCell(startX, startY, this.canvas);
      if (cell) this.cb.onPrimary(cell);
    }
  }

  private cancelTouch(): void {
    this.clearLongPress();
    this.touch = null;
  }

  private clearLongPress(): void {
    if (this.touch?.longPress) window.clearTimeout(this.touch.longPress);
  }
}
