import * as THREE from 'three';
import { COLS, ROWS } from '../engine/map';
import { DAY } from './palette';

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uWaveAmp;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  varying float vWave;
  #include <fog_pars_vertex>

  // Max. Auslenkung ~0.115 — bleibt unter den Zahlen-Billboards (y = 0.2)
  float waveH(vec2 p) {
    return (sin(p.x * 0.55 + uTime * 0.9) * 0.035 +
            sin((p.x + p.y) * 0.32 - uTime * 0.7) * 0.05 +
            sin(p.y * 0.48 + uTime * 1.25) * 0.03) * uWaveAmp;
  }

  void main() {
    vec3 pos = position;
    vec2 p = position.xz;
    float h = waveH(p);
    pos.y += h;
    vWave = h / max(uWaveAmp, 0.001);
    float e = 0.4;
    float hx = waveH(p + vec2(e, 0.0)) - waveH(p - vec2(e, 0.0));
    float hz = waveH(p + vec2(0.0, e)) - waveH(p - vec2(0.0, e));
    vNormalW = normalize(vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e)));
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vec4 mvPosition = viewMatrix * worldPos;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSparkle;
  uniform float uSparkleStrength;
  uniform vec3 uSunDir;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;
  varying float vWave;
  #include <fog_pars_fragment>

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 sun = normalize(uSunDir);
    float diff = max(dot(n, sun), 0.0);
    vec3 col = mix(uDeep, uShallow, smoothstep(-0.1, 0.11, vWave));
    col *= 0.78 + 0.4 * diff;

    // Stilisiertes Glitzern: spiegelnder Sonnenanteil + funkelnde Zellen
    vec3 refl = reflect(-sun, n);
    float spec = pow(max(refl.y, 0.0), 48.0);
    float twinkle = step(0.993, hash(floor(vWorldPos.xz * 5.0) + floor(uTime * 2.5)));
    col += uSparkle * (spec * 0.55 + twinkle * 0.7 * diff) * uSparkleStrength;

    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;

export interface Water {
  mesh: THREE.Mesh;
  uniforms: {
    uTime: THREE.IUniform<number>;
    uWaveAmp: THREE.IUniform<number>;
    uDeep: THREE.IUniform<THREE.Color>;
    uShallow: THREE.IUniform<THREE.Color>;
    uSparkle: THREE.IUniform<THREE.Color>;
    uSparkleStrength: THREE.IUniform<number>;
    uSunDir: THREE.IUniform<THREE.Vector3>;
  };
}

export function createWater(): Water {
  const margin = 26;
  const width = COLS + margin * 2;
  const depth = ROWS + margin * 2;
  const geometry = new THREE.PlaneGeometry(width, depth, Math.floor(width / 1.5), Math.floor(depth / 1.5));
  geometry.rotateX(-Math.PI / 2);

  const uniforms: Water['uniforms'] = {
    uTime: { value: 0 },
    uWaveAmp: { value: 1 },
    uDeep: { value: DAY.waterDeep.clone() },
    uShallow: { value: DAY.waterShallow.clone() },
    uSparkle: { value: DAY.sparkle.clone() },
    uSparkleStrength: { value: DAY.sparkleStrength },
    uSunDir: { value: DAY.sunDir.clone() },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { ...uniforms, ...THREE.UniformsLib.fog },
    fog: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = 0;
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}
