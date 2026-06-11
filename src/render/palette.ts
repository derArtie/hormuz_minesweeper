import * as THREE from 'three';

/** Licht-/Farbstimmung für Tag bzw. Nacht; DayNight blendet dazwischen über. */
export interface Mood {
  sky: THREE.Color;
  fog: THREE.Color;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunDir: THREE.Vector3;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  waterDeep: THREE.Color;
  waterShallow: THREE.Color;
  sparkle: THREE.Color;
  sparkleStrength: number;
  buoyIntensity: number;
}

export const DAY: Mood = {
  sky: new THREE.Color('#8ecbe8'),
  fog: new THREE.Color('#a8d5ea'),
  sunColor: new THREE.Color('#fff3d6'),
  sunIntensity: 2.6,
  sunDir: new THREE.Vector3(0.55, 1.0, 0.4),
  hemiSky: new THREE.Color('#cfe8f5'),
  hemiGround: new THREE.Color('#c8a878'),
  hemiIntensity: 0.9,
  waterDeep: new THREE.Color('#1668a8'),
  waterShallow: new THREE.Color('#3f97cf'),
  sparkle: new THREE.Color('#fff7e0'),
  sparkleStrength: 1.0,
  buoyIntensity: 0,
};

export const NIGHT: Mood = {
  sky: new THREE.Color('#06121f'),
  fog: new THREE.Color('#0a1a2c'),
  sunColor: new THREE.Color('#b8cfee'),
  sunIntensity: 0.9,
  sunDir: new THREE.Vector3(-0.45, 1.0, -0.3),
  hemiSky: new THREE.Color('#22344e'),
  hemiGround: new THREE.Color('#141d26'),
  hemiIntensity: 0.55,
  waterDeep: new THREE.Color('#07304f'),
  waterShallow: new THREE.Color('#0d4a74'),
  sparkle: new THREE.Color('#bcd8ff'),
  sparkleStrength: 0.55,
  buoyIntensity: 2.2,
};

/** Zahlenfarben 1–8, klassisch farbcodiert, auf dunklem Wasser lesbar. */
export const NUMBER_COLORS = [
  '',
  '#6db5ff',
  '#5ee07a',
  '#ff6b5e',
  '#b9a8ff',
  '#ffb38a',
  '#5fe0e0',
  '#f2f2f2',
  '#c2c2c2',
] as const;

export const TILE_A = new THREE.Color('#0e4f86');
export const TILE_B = new THREE.Color('#0c4778');
export const TILE_HOVER = new THREE.Color('#2a7ab8');
