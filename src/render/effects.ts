import * as THREE from 'three';

const CAPACITY = 700;

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aLife;
  attribute vec3 aColor;
  varying float vLife;
  varying vec3 vColor;
  void main() {
    vLife = aLife;
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (160.0 / -mvPosition.z) * max(aLife, 0.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  varying float vLife;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.12, d) * clamp(vLife, 0.0, 1.0);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

interface Particle {
  alive: boolean;
  vx: number;
  vy: number;
  vz: number;
  decay: number;
  gravity: number;
}

/**
 * Gepooltes Partikelsystem (ein einziges THREE.Points, additiv):
 * Explosionen, Wasserspritzer und Kielwasser teilen sich das Budget.
 */
export class Effects {
  readonly points: THREE.Points;
  readonly flash: THREE.PointLight;
  /** Multiplikator fürs Partikel-Budget (reduced motion → 0.35). */
  budget = 1;

  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly sizes: Float32Array;
  private readonly lifes: Float32Array;
  private readonly particles: Particle[] = [];
  private cursor = 0;
  private flashDecay = 0;

  constructor() {
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(CAPACITY * 3);
    this.colors = new Float32Array(CAPACITY * 3);
    this.sizes = new Float32Array(CAPACITY);
    this.lifes = new Float32Array(CAPACITY);
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aLife', new THREE.BufferAttribute(this.lifes, 1));
    for (let i = 0; i < CAPACITY; i++)
      this.particles.push({ alive: false, vx: 0, vy: 0, vz: 0, decay: 1, gravity: 0 });

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;

    this.flash = new THREE.PointLight('#ffaa44', 0, 16, 1.6);
    this.flash.position.set(0, 2, 0);
  }

  private spawn(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    color: THREE.Color,
    size: number,
    decay: number,
    gravity: number,
  ): void {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % CAPACITY;
    const p = this.particles[i];
    p.alive = true;
    p.vx = vel.x;
    p.vy = vel.y;
    p.vz = vel.z;
    p.decay = decay;
    p.gravity = gravity;
    this.positions.set([pos.x, pos.y, pos.z], i * 3);
    this.colors.set([color.r, color.g, color.b], i * 3);
    this.sizes[i] = size;
    this.lifes[i] = 1;
  }

  spawnExplosion(pos: THREE.Vector3): void {
    const n = Math.round(42 * this.budget);
    const orange = new THREE.Color('#ff7722');
    const yellow = new THREE.Color('#ffcc33');
    const smoke = new THREE.Color('#553322');
    for (let i = 0; i < n; i++) {
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() * 0.9,
        Math.random() - 0.5,
      ).normalize();
      const speed = 2.2 + Math.random() * 4.5;
      const color = i % 5 === 0 ? smoke : Math.random() < 0.5 ? orange : yellow;
      this.spawn(
        pos,
        dir.multiplyScalar(speed),
        color,
        0.5 + Math.random() * 0.7,
        1.4 + Math.random() * 1.3,
        6,
      );
    }
    this.flash.position.copy(pos).add(new THREE.Vector3(0, 1.4, 0));
    this.flash.intensity = 60;
    this.flashDecay = 1;
  }

  spawnSplash(pos: THREE.Vector3): void {
    const n = Math.round(6 * this.budget);
    const foam = new THREE.Color('#bfe3ff');
    for (let i = 0; i < n; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.6,
        1.2 + Math.random() * 1.6,
        (Math.random() - 0.5) * 1.6,
      );
      this.spawn(pos, vel, foam, 0.3 + Math.random() * 0.25, 2.4, 7);
    }
  }

  spawnWake(pos: THREE.Vector3): void {
    if (this.budget < 0.5) return;
    const foam = new THREE.Color('#d8eeff');
    for (let i = 0; i < 2; i++) {
      const vel = new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.25, (Math.random() - 0.5) * 0.5);
      this.spawn(pos, vel, foam, 0.22, 1.8, 1.2);
    }
  }

  update(dt: number): void {
    const posAttr = this.points.geometry.attributes.position;
    const lifeAttr = this.points.geometry.attributes.aLife;
    let any = false;
    for (let i = 0; i < CAPACITY; i++) {
      const p = this.particles[i];
      if (!p.alive) continue;
      any = true;
      this.lifes[i] -= p.decay * dt;
      if (this.lifes[i] <= 0) {
        this.lifes[i] = 0;
        p.alive = false;
        continue;
      }
      p.vy -= p.gravity * dt;
      this.positions[i * 3] += p.vx * dt;
      this.positions[i * 3 + 1] += p.vy * dt;
      this.positions[i * 3 + 2] += p.vz * dt;
    }
    if (any) {
      posAttr.needsUpdate = true;
      lifeAttr.needsUpdate = true;
    }
    if (this.flashDecay > 0) {
      this.flashDecay = Math.max(0, this.flashDecay - dt * 3.2);
      this.flash.intensity = 60 * this.flashDecay * this.flashDecay;
    }
  }
}

/** Konfetti als 2D-Overlay über der Szene (außerhalb des 3D-Transforms). */
export class ConfettiOverlay {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private pieces: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    color: string;
    angle: number;
    spin: number;
    w: number;
    h: number;
  }[] = [];

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-overlay';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  burst(count = 110): void {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#f06595', '#74c0fc'];
    for (let i = 0; i < count; i++) {
      this.pieces.push({
        x: Math.random() * this.canvas.width,
        y: -20 - Math.random() * 120,
        vx: (Math.random() - 0.5) * 160,
        vy: 90 + Math.random() * 160,
        life: 1,
        decay: 0.16 + Math.random() * 0.22,
        color: colors[Math.floor(Math.random() * colors.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 14,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
      });
    }
  }

  clear(): void {
    this.pieces = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update(dt: number): void {
    if (this.pieces.length === 0) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.pieces = this.pieces.filter((p) => p.life > 0);
    for (const p of this.pieces) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      p.vx *= 1 - 0.4 * dt;
      p.angle += p.spin * dt;
      p.life -= p.decay * dt;
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.angle);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
    }
  }
}
