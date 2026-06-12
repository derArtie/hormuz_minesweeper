import * as THREE from 'three';
import { COLS, ROWS, isLand, isPlayable } from '../engine/map';
import { DAY, NIGHT, type Mood } from './palette';
import { buildBuoyMesh } from './props';
import type { Water } from './water';

const TRANSITION_SECONDS = 1.4;

/**
 * Leuchtbojen-Positionen aus der Karte ableiten: Ketten von Fahrwassertonnen
 * vor den offenen Kanten, an denen das befahrbare Wasser die Karte verlässt —
 * Westzufahrt (Persischer Golf), Ostzufahrt und Südost-Ausgang (Golf von
 * Oman). Sie liegen knapp außerhalb des Spielfelds: garantiert auf Wasser,
 * nie auf Land und nie unter einer Spielfeld-Kachel.
 */
function buoyPositions(): [number, number][] {
  const west: number[] = [];
  const east: number[] = [];
  const south: number[] = [];
  for (let r = 0; r < ROWS; r++) {
    if (!isLand[r][0] && isPlayable[r][0]) west.push(r);
    if (!isLand[r][COLS - 1] && isPlayable[r][COLS - 1]) east.push(r);
  }
  for (let c = 0; c < COLS; c++) if (!isLand[ROWS - 1][c] && isPlayable[ROWS - 1][c]) south.push(c);

  const every = (arr: number[], n: number) => arr.filter((_, i) => i % n === Math.floor(n / 2));
  const picked: [number, number][] = [];
  for (const r of every(west, 3)) picked.push([-COLS / 2 - 1.5, r - ROWS / 2 + 0.5]);
  for (const r of every(east, 3)) picked.push([COLS / 2 + 1.5, r - ROWS / 2 + 0.5]);
  for (const c of every(south, 3)) picked.push([c - COLS / 2 + 0.5, ROWS / 2 + 1.5]);
  return picked;
}

/**
 * Echter Licht-Wechsel: Sonne/Mond, Farbtemperatur, Nebel, Wasserfarben und
 * Leuchtbojen werden zwischen Tag- und Nacht-Stimmung überblendet.
 */
export class DayNight {
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly buoys: THREE.Group;

  /** 0 = Nacht, 1 = Tag */
  private factor: number;
  private targetFactor: number;
  private readonly buoyLights: THREE.PointLight[] = [];
  private readonly buoyBulbs: THREE.MeshStandardMaterial[] = [];

  constructor(
    private readonly scene: THREE.Scene,
    private readonly water: Water,
    startDay: boolean,
  ) {
    this.factor = startDay ? 1 : 0;
    this.targetFactor = this.factor;
    this.sun = new THREE.DirectionalLight();
    this.hemi = new THREE.HemisphereLight();
    this.scene.add(this.sun, this.hemi);
    this.scene.fog = new THREE.Fog(0x000000, 60, 220);

    this.buoys = new THREE.Group();
    // Echte PointLights sind teuer (Forward-Rendering): nur jede zweite Boje
    // bekommt eine, gedeckelt — alle leuchten aber über ihr Emissive-Material.
    const positions = buoyPositions();
    const maxLights = 8;
    positions.forEach(([x, z], i) => {
      const bulbMat = new THREE.MeshStandardMaterial({
        color: '#ffd27a',
        emissive: new THREE.Color('#ffb347'),
        emissiveIntensity: 0,
      });
      const buoy = buildBuoyMesh(bulbMat);
      buoy.position.set(x, 0, z);
      this.buoys.add(buoy);
      this.buoyBulbs.push(bulbMat);
      if (i % 2 === 0 && this.buoyLights.length < maxLights) {
        const light = new THREE.PointLight('#ffb347', 0, 9, 2);
        light.position.set(x, 0.9, z);
        this.buoys.add(light);
        this.buoyLights.push(light);
      }
    });
    this.scene.add(this.buoys);
    this.applyMood();
  }

  get isDay(): boolean {
    return this.targetFactor > 0.5;
  }

  toggle(): boolean {
    this.targetFactor = this.isDay ? 0 : 1;
    document.documentElement.classList.toggle('day', this.isDay);
    return this.isDay;
  }

  update(dt: number, time: number): void {
    if (this.factor !== this.targetFactor) {
      const step = dt / TRANSITION_SECONDS;
      this.factor =
        this.factor < this.targetFactor
          ? Math.min(this.targetFactor, this.factor + step)
          : Math.max(this.targetFactor, this.factor - step);
      this.applyMood();
    }
    // Bojen blinken nachts sanft
    const night = 1 - this.factor;
    if (night > 0.01) {
      const pulse = 0.65 + 0.35 * Math.sin(time * 2.2);
      for (const light of this.buoyLights) light.intensity = NIGHT.buoyIntensity * night * pulse;
      for (const bulb of this.buoyBulbs) bulb.emissiveIntensity = 2.4 * night * pulse;
    }
  }

  private applyMood(): void {
    const k = this.factor;
    const lerpC = (a: THREE.Color, b: THREE.Color) => a.clone().lerp(b, k);
    const m: Mood = {
      sky: lerpC(NIGHT.sky, DAY.sky),
      fog: lerpC(NIGHT.fog, DAY.fog),
      sunColor: lerpC(NIGHT.sunColor, DAY.sunColor),
      sunIntensity: THREE.MathUtils.lerp(NIGHT.sunIntensity, DAY.sunIntensity, k),
      sunDir: NIGHT.sunDir.clone().lerp(DAY.sunDir, k),
      hemiSky: lerpC(NIGHT.hemiSky, DAY.hemiSky),
      hemiGround: lerpC(NIGHT.hemiGround, DAY.hemiGround),
      hemiIntensity: THREE.MathUtils.lerp(NIGHT.hemiIntensity, DAY.hemiIntensity, k),
      waterDeep: lerpC(NIGHT.waterDeep, DAY.waterDeep),
      waterShallow: lerpC(NIGHT.waterShallow, DAY.waterShallow),
      sparkle: lerpC(NIGHT.sparkle, DAY.sparkle),
      sparkleStrength: THREE.MathUtils.lerp(NIGHT.sparkleStrength, DAY.sparkleStrength, k),
      buoyIntensity: THREE.MathUtils.lerp(NIGHT.buoyIntensity, DAY.buoyIntensity, k),
    };

    this.scene.background = m.sky;
    const fog = this.scene.fog as THREE.Fog;
    fog.color.copy(m.fog);
    this.sun.color.copy(m.sunColor);
    this.sun.intensity = m.sunIntensity;
    this.sun.position.copy(m.sunDir).multiplyScalar(60);
    this.hemi.color.copy(m.hemiSky);
    this.hemi.groundColor.copy(m.hemiGround);
    this.hemi.intensity = m.hemiIntensity;

    this.water.uniforms.uDeep.value.copy(m.waterDeep);
    this.water.uniforms.uShallow.value.copy(m.waterShallow);
    this.water.uniforms.uSparkle.value.copy(m.sparkle);
    this.water.uniforms.uSparkleStrength.value = m.sparkleStrength;
    this.water.uniforms.uSunDir.value.copy(m.sunDir);

    for (const light of this.buoyLights) light.intensity = m.buoyIntensity;
  }
}
