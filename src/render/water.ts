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

  // Weiches Value-Noise — stetig in Raum und Zeit, keine sichtbaren Zellen
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // Zwei driftende Oktaven als Mikro-Ripples unterhalb der Geometrie-Auflösung
  float ripple(vec2 p) {
    return vnoise(p * 1.6 + vec2(uTime * 0.21, uTime * 0.16)) * 0.65 +
           vnoise(p * 3.4 + vec2(-uTime * 0.13, uTime * 0.27)) * 0.35;
  }

  void main() {
    vec3 sun = normalize(uSunDir);
    vec2 p = vWorldPos.xz;

    // Geometrie-Normale, verfeinert um die Mikro-Ripples.
    // Wichtig: Die Detail-Normale treibt nur den Specular-Glitter —
    // die Diffuse-Beleuchtung nutzt die glatte Wellen-Normale, sonst
    // marmoriert die ganze Fläche.
    vec3 nGeo = normalize(vNormalW);
    float e = 0.35;
    float rx = ripple(p + vec2(e, 0.0)) - ripple(p - vec2(e, 0.0));
    float rz = ripple(p + vec2(0.0, e)) - ripple(p - vec2(0.0, e));
    vec3 n = normalize(nGeo + vec3(-rx, 0.0, -rz) * 0.7);

    float diff = max(dot(nGeo, sun), 0.0);
    float crestK = vWave / 0.115; // normalisierte Wellenhöhe (-1 … 1)
    vec3 col = mix(uDeep, uShallow, smoothstep(-0.85, 0.95, crestK));
    col *= 0.78 + 0.4 * diff;

    // Sonnen-Glitter: blickabhängiger Blinn-Specular auf der Ripple-Normale.
    // Kleine, scharfe Glanzpunkte dort, wo eine Mikro-Welle das Licht zur
    // Kamera spiegelt — plus ein weicher Lichtsaum als Sonnen-/Mondstraße.
    vec3 toCam = cameraPosition - vWorldPos;
    vec3 view = normalize(toCam);
    vec3 h = normalize(sun + view);
    float ndh = max(dot(n, h), 0.0);
    // In der Ferne ausblenden (sonst rauscht es bei flachem Blickwinkel)
    float distF = smoothstep(95.0, 30.0, length(toCam));
    // Großflächige Wind-Flecken: ruhige und glitzernde Zonen wechseln sich ab
    float gust = smoothstep(0.28, 0.78, vnoise(p * 0.28 + vec2(uTime * 0.05, -uTime * 0.04)));
    float glitter = pow(ndh, 220.0) * 1.1 * mix(0.25, 1.0, gust) * mix(0.3, 1.0, distF);
    float sheen = pow(ndh, 24.0) * 0.16;

    // Schaum nur auf den Kämmen, durch Noise aufgebrochen statt als Linie
    float foamMask = vnoise(p * 2.2 + vec2(uTime * 0.3, -uTime * 0.22));
    float crest = smoothstep(0.6, 1.0, crestK) * smoothstep(0.45, 0.85, foamMask) * 0.18;

    col += uSparkle * (glitter + sheen + crest * (0.4 + 0.6 * diff)) * uSparkleStrength;

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
