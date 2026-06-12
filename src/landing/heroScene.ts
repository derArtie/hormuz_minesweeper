import * as THREE from 'three';
import { mineGeometry } from '../render/mineGeometry';
import { dolphinMesh, whaleMesh } from '../render/seaLife';
import { buildShipMesh } from '../render/ship';
import { createWater, type Water } from '../render/water';

/** Sturm-Parameter — Wellenformel muss mit dem Shader in water.ts übereinstimmen. */
const STORM_AMP = 2.6;
const CALM_AMP = 1.0;
const MINE_COUNT = 9;
const MINE_SPEED = 1.35; // Minen driften nach -X vorbei → Illusion einer Fahrt nach +X
const RAIN_COUNT = 360;

function waveHeight(x: number, z: number, t: number, amp: number): number {
  return (
    (Math.sin(x * 0.55 + t * 0.9) * 0.035 +
      Math.sin((x + z) * 0.32 - t * 0.7) * 0.05 +
      Math.sin(z * 0.48 + t * 1.25) * 0.03) *
    amp
  );
}

function glowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(225, 238, 255, 0.9)');
  grad.addColorStop(0.35, 'rgba(180, 205, 240, 0.35)');
  grad.addColorStop(1, 'rgba(150, 180, 220, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

interface Mine {
  mesh: THREE.Mesh;
  spin: number;
  phase: number;
}

interface DolphinEscort {
  kind: 'dolphins';
  group: THREE.Group;
  t: number;
  pod: { mesh: THREE.Group; lag: number; side: number; phase: number }[];
}

interface WhaleSighting {
  kind: 'whale';
  group: THREE.Group;
  t: number;
  mesh: THREE.Group;
  offX: number;
  offZ: number;
}

type Escort = DolphinEscort | WhaleSighting;

/**
 * Kino-Hintergrund der Startseite: ein Patrouillenschiff pflügt nachts durch
 * stürmische See, vorbei an treibenden Seeminen — mit Mond, Regen und Blitzen.
 */
export class HeroScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly water: Water;
  private readonly ship: THREE.Group;
  private readonly mines: Mine[] = [];
  private readonly rain: THREE.Points | null = null;
  private readonly rainVel: Float32Array | null = null;
  private readonly moonLight: THREE.DirectionalLight;
  private readonly flashLight: THREE.DirectionalLight;
  private readonly baseFog = new THREE.Color('#0a1622');
  private readonly baseSky = new THREE.Color('#060d16');
  private readonly flashSky = new THREE.Color('#36506e');

  private readonly amp: number;
  private readonly reduced: boolean;
  private time = 0;
  private nextLightning = 5;
  private flashT = 0;
  private scrollProgress = 0;
  private escort: Escort | null = null;
  private nextEscortIn = 9;

  /** Seitliche Reichweite der Schiffsdrift — aspektabhängig, damit das Schiff im Bild bleibt. */
  private shipRange = 3;

  constructor(private readonly container: HTMLElement) {
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.amp = this.reduced ? CALM_AMP : STORM_AMP;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.3, 220);
    this.scene.fog = new THREE.Fog(this.baseFog, 22, 115);
    this.scene.background = this.baseSky.clone();

    // Sturm-See: Wasser-Shader aus dem Spiel mit dunkler Gewitterstimmung
    this.water = createWater();
    this.water.uniforms.uWaveAmp.value = this.amp;
    this.water.uniforms.uDeep.value.set('#0a2236');
    this.water.uniforms.uShallow.value.set('#17486a');
    this.water.uniforms.uSparkle.value.set('#cde2fa');
    this.water.uniforms.uSparkleStrength.value = 0.75;
    this.water.uniforms.uSunDir.value.set(-0.5, 1, -0.55);
    this.scene.add(this.water.mesh);

    // Licht: kühles Mondlicht + Restlicht, Blitz als zweite Directional
    this.moonLight = new THREE.DirectionalLight('#a8c4e8', 2.3);
    this.moonLight.position.set(-22, 26, -34);
    this.flashLight = new THREE.DirectionalLight('#dceaff', 0);
    this.flashLight.position.set(10, 30, -10);
    this.scene.add(
      this.moonLight,
      this.flashLight,
      new THREE.HemisphereLight('#273a52', '#0c141d', 0.85),
    );

    // Mond mit additivem Glow
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 20, 14),
      new THREE.MeshBasicMaterial({ color: '#eef4fd' }),
    );
    moon.position.set(-24, 16, -60);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.8,
      }),
    );
    glow.scale.setScalar(11);
    glow.position.copy(moon.position);
    this.scene.add(moon, glow);

    // Schiff
    this.ship = buildShipMesh();
    this.ship.scale.setScalar(1.9);
    this.scene.add(this.ship);

    // Treibende Seeminen
    const mineGeo = mineGeometry();
    const mineMat = new THREE.MeshStandardMaterial({
      color: '#39424c',
      roughness: 0.45,
      metalness: 0.5,
    });
    for (let i = 0; i < MINE_COUNT; i++) {
      const mesh = new THREE.Mesh(mineGeo, mineMat);
      mesh.scale.setScalar(1.1 + Math.random() * 0.7);
      this.mines.push({ mesh, spin: (Math.random() - 0.5) * 0.5, phase: Math.random() * 9 });
      this.respawnMine(this.mines[i], true);
      this.scene.add(mesh);
    }

    // Regen (entfällt bei reduced motion)
    if (!this.reduced) {
      const positions = new Float32Array(RAIN_COUNT * 3);
      this.rainVel = new Float32Array(RAIN_COUNT);
      for (let i = 0; i < RAIN_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = Math.random() * 22;
        positions[i * 3 + 2] = 8 - Math.random() * 45;
        this.rainVel[i] = 14 + Math.random() * 10;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.rain = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: '#8fb0cf',
          size: 0.07,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        }),
      );
      this.rain.frustumCulled = false;
      this.scene.add(this.rain);
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Delfine eskortieren das Schiff; selten zieht ein Wal im Hintergrund mit. */
  private spawnEscort(): void {
    const group = new THREE.Group();
    if (Math.random() < 0.3) {
      const mesh = whaleMesh();
      mesh.scale.setScalar(1.5);
      group.add(mesh);
      this.escort = {
        kind: 'whale',
        group,
        t: 0,
        mesh,
        offX: -7 + Math.random() * 10,
        offZ: -3.5 - Math.random() * 4,
      };
    } else {
      const pod: DolphinEscort['pod'] = [];
      const n = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        const mesh = dolphinMesh();
        mesh.scale.setScalar(1.25);
        group.add(mesh);
        pod.push({
          mesh,
          lag: i * 1.1 + Math.random() * 0.3,
          side: (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * 0.8,
          phase: Math.random() * 1.2,
        });
      }
      this.escort = { kind: 'dolphins', group, t: 0, pod };
    }
    this.scene.add(group);
  }

  private clearEscort(): void {
    if (this.escort) this.scene.remove(this.escort.group);
    this.escort = null;
    this.nextEscortIn = 16 + Math.random() * 18;
  }

  private updateEscort(dt: number, shipX: number, shipZ: number): void {
    if (!this.escort) {
      this.nextEscortIn -= dt;
      if (this.nextEscortIn <= 0) this.spawnEscort();
      return;
    }
    const e = this.escort;
    e.t += dt;
    const next = new THREE.Vector3();

    if (e.kind === 'dolphins') {
      // Die Delfine kommen von hinten, überholen porpoising längsseits
      // und tauchen ein Stück vor dem Bug ab — schneller als das Schiff,
      // wie es sich für eine Bugwellen-Eskorte gehört.
      const sBase = -9 + e.t * 1.4;
      for (const d of e.pod) {
        const s = sBase - d.lag;
        const sample = (ss: number, out: THREE.Vector3) => {
          const x = shipX + ss;
          const z = shipZ + 2.1 + d.side;
          const arc = Math.sin(((ss + d.phase) * Math.PI * 2) / 3.6);
          let y = waveHeight(x, z, this.time, this.amp) * 0.5 - 0.3 + 0.85 * arc;
          if (ss > 8) y -= (ss - 8) * 1.4; // vor dem Schiff abtauchen
          return out.set(x, y, z);
        };
        sample(s, d.mesh.position);
        d.mesh.lookAt(sample(s + 0.2, next));
      }
      if (sBase - e.pod[e.pod.length - 1].lag > 11) this.clearEscort();
      return;
    }

    // Wal: schwimmt im Hintergrund mit dem Schiff mit — auftauchen,
    // kurz an der Oberfläche wogen, mit gesenkter Nase wieder abtauchen
    const x = shipX + e.offX + e.t * 0.12;
    const z = shipZ + e.offZ;
    const swell = waveHeight(x, z, this.time, this.amp) * 0.4;
    let y: number;
    let droop = 0;
    if (e.t < 2.2) {
      const k = THREE.MathUtils.smoothstep(e.t / 2.2, 0, 1);
      y = THREE.MathUtils.lerp(-2.6, -0.22, k) + swell * k;
    } else if (e.t < 6.4) {
      y = -0.22 + swell;
    } else {
      const k = Math.min(1, (e.t - 6.4) / 2.4);
      y = THREE.MathUtils.lerp(-0.22 + swell, -3.0, k * k);
      droop = k * 1.6;
    }
    e.mesh.position.set(x, y, z);
    e.mesh.lookAt(next.set(x + 1.5, y - droop, z));
    if (e.t > 9.2) this.clearEscort();
  }

  private respawnMine(mine: Mine, initial: boolean): void {
    mine.mesh.position.set(
      initial ? -16 + Math.random() * 44 : 26 + Math.random() * 14,
      0,
      4 - Math.random() * 16,
    );
  }

  setScroll(progress: number): void {
    this.scrollProgress = Math.min(1.4, Math.max(0, progress));
  }

  /** Rendern lohnt nur, solange der Hero (teilweise) sichtbar ist. */
  get active(): boolean {
    return this.scrollProgress < 1.25 && !document.hidden;
  }

  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    // Sichtbare halbe Breite auf Höhe des Schiffs (Kamera z≈11, Schiff z≈2.5)
    const halfWidth = Math.tan(THREE.MathUtils.degToRad(25)) * 8.4 * this.camera.aspect;
    this.shipRange = THREE.MathUtils.clamp(halfWidth - 1.6, 2.2, 5.5);
  }

  update(dt: number): void {
    this.time += dt;
    const t = this.time;
    this.water.uniforms.uTime.value = t;

    // Schiff: Laufband-Illusion — der Bug zeigt konsequent nach vorn (+X),
    // die See samt Minen strömt schneller entgegen, als das Schiff im Bild
    // driftet (max. Driftgeschwindigkeit ≈ 0.3 ≪ MINE_SPEED). Die langsame
    // Drift zwischen linkem Drittel und Bildmitte hält es immer im Frame.
    const r = this.shipRange;
    const shipX = -r * 0.35 + r * 0.65 * Math.sin(t * 0.08);
    const shipZ = 2.4 + Math.sin(t * 0.06) * 1.2;
    const e = 0.6;
    const h = waveHeight(shipX, shipZ, t, this.amp);
    const hx = (waveHeight(shipX + e, shipZ, t, this.amp) - waveHeight(shipX - e, shipZ, t, this.amp)) / (2 * e);
    const hz = (waveHeight(shipX, shipZ + e, t, this.amp) - waveHeight(shipX, shipZ - e, t, this.amp)) / (2 * e);
    this.ship.position.set(shipX, h + 0.05, shipZ);
    this.ship.rotation.z = -Math.atan(hx) * 0.7 + Math.sin(t * 1.4) * 0.02;
    this.ship.rotation.x = Math.atan(hz) * 0.7;
    // leichte Kurskorrekturen, aber nie eine Wende
    this.ship.rotation.y = Math.sin(t * 0.06) * 0.14 + Math.sin(t * 0.17) * 0.05;

    // Minen driften vorbei, tanzen auf den Wellen und weichen dem Schiff aus
    for (const mine of this.mines) {
      const p = mine.mesh.position;
      p.x -= MINE_SPEED * dt;
      const dx = p.x - shipX;
      const dz = p.z - shipZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < 12.25) {
        // sanfte Abstoßung im 3.5er-Radius: keine Mine treibt durchs Boot
        const dist = Math.sqrt(distSq) || 0.001;
        const push = ((3.5 - dist) * 2.2 * dt) / dist;
        p.x += dx * push;
        p.z += dz * push;
      }
      p.y = waveHeight(p.x, p.z, t + mine.phase, this.amp) + 0.12;
      mine.mesh.rotation.y += mine.spin * dt;
      mine.mesh.rotation.x = Math.sin(t * 0.8 + mine.phase) * 0.18;
      if (p.x < -26) this.respawnMine(mine, false);
    }

    // Meeresleben schwimmt mit dem Schiff (entfällt bei reduced motion)
    if (!this.reduced) this.updateEscort(dt, shipX, shipZ);

    // Regen fällt schräg im Wind
    if (this.rain && this.rainVel) {
      const pos = this.rain.geometry.attributes.position;
      for (let i = 0; i < RAIN_COUNT; i++) {
        let y = pos.getY(i) - this.rainVel[i] * dt;
        let x = pos.getX(i) - 6 * dt;
        if (y < 0) {
          y = 18 + Math.random() * 6;
          x = (Math.random() - 0.5) * 50;
        }
        pos.setX(i, x);
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // Blitze: unregelmäßig, mit Flacker-Muster
    if (!this.reduced) {
      this.nextLightning -= dt;
      if (this.nextLightning <= 0) {
        this.flashT = 1;
        this.nextLightning = 5 + Math.random() * 9;
        this.flashLight.position.set(-20 + Math.random() * 40, 30, -30 + Math.random() * 20);
      }
      if (this.flashT > 0) {
        this.flashT = Math.max(0, this.flashT - dt * 2.6);
        const flicker = Math.max(0, Math.sin(this.flashT * 28)) * this.flashT * this.flashT;
        this.flashLight.intensity = 9 * flicker;
        (this.scene.background as THREE.Color).copy(this.baseSky).lerp(this.flashSky, flicker);
        this.scene.fog!.color.copy(this.baseFog).lerp(this.flashSky, flicker * 0.6);
      }
    }

    // Kamera: tiefer Kinoblick mit Schwell-Bewegung; Scroll hebt sie an
    const p = this.scrollProgress;
    this.camera.position.set(
      Math.sin(t * 0.09) * 0.5,
      2.6 + Math.sin(t * 0.21) * 0.18 + p * 5,
      11 - p * 2,
    );
    this.camera.lookAt(0, 0.6 - p * 1.5, -4);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
