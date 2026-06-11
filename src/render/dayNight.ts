import * as THREE from 'three';
import { DAY, NIGHT, type Mood } from './palette';
import type { Water } from './water';

const TRANSITION_SECONDS = 1.4;

/** Positionen der Leuchtbojen (Weltkoordinaten, entlang der Straße von Hormuz). */
const BUOY_POSITIONS: [number, number][] = [
  [2, -2],
  [7, 1],
  [12, 4],
  [-10, 4],
];

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
    const bulbGeo = new THREE.SphereGeometry(0.16, 8, 6);
    const baseGeo = new THREE.CylinderGeometry(0.1, 0.22, 0.5, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: '#b3402a', roughness: 0.8 });
    for (const [x, z] of BUOY_POSITIONS) {
      const bulbMat = new THREE.MeshStandardMaterial({
        color: '#ffd27a',
        emissive: new THREE.Color('#ffb347'),
        emissiveIntensity: 0,
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(x, 0.62, z);
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(x, 0.25, z);
      const light = new THREE.PointLight('#ffb347', 0, 9, 2);
      light.position.set(x, 0.9, z);
      this.buoys.add(bulb, base, light);
      this.buoyLights.push(light);
      this.buoyBulbs.push(bulbMat);
    }
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
      for (let i = 0; i < this.buoyLights.length; i++) {
        this.buoyLights[i].intensity = NIGHT.buoyIntensity * night * pulse;
        this.buoyBulbs[i].emissiveIntensity = 2.4 * night * pulse;
      }
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
