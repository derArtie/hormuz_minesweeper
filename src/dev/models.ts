import * as THREE from 'three';
import { mineGeometry } from '../render/mineGeometry';
import { buildBuoyMesh, flagClothGeometry, flagPoleGeometry } from '../render/props';
import { dolphinMesh, fishMesh, whaleMesh } from '../render/seaLife';
import { buildShipMesh } from '../render/ship';

/**
 * Dev-Modellübersicht (models.html): zeigt jedes prozedurale 3D-Modell des
 * Spiels in einer eigenen Karte. Ein gemeinsamer WebGL-Renderer zeichnet per
 * Scissor-Test in die Kartenbereiche — so gibt es keine Kontext-Limits.
 * Nur über den Dev-Server erreichbar (nicht in den Build-Inputs).
 */

/** Flagge wie in boardView.ts (Mast + gewelltes Tuch, dort instanced). */
function flagMesh(): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    flagPoleGeometry(),
    new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.6 }),
  );
  const cloth = new THREE.Mesh(
    flagClothGeometry(),
    new THREE.MeshStandardMaterial({ color: '#e23a2e', roughness: 0.7, side: THREE.DoubleSide }),
  );
  g.add(pole, cloth);
  return g;
}

/** Leuchtboje wie in dayNight.ts — hier mit Nacht-Emissive, damit sie glüht. */
function buoyMesh(): THREE.Group {
  return buildBuoyMesh(
    new THREE.MeshStandardMaterial({
      color: '#ffd27a',
      emissive: new THREE.Color('#ffb347'),
      emissiveIntensity: 1.8,
    }),
  );
}

/** Seemine wie in boardView.ts (Geometrie + dortiges Material). */
function mineMesh(): THREE.Mesh {
  return new THREE.Mesh(
    mineGeometry(),
    new THREE.MeshStandardMaterial({ color: '#39434d', roughness: 0.4, metalness: 0.45 }),
  );
}

interface ModelDef {
  name: string;
  desc: string;
  src: string;
  build: () => THREE.Object3D;
}

const MODELS: ModelDef[] = [
  {
    name: 'Patrouillenschiff',
    desc: 'Spielerschiff im Patrouille-Modus, mit Navigationslicht — auch in der Hero-Szene der Landing Page.',
    src: 'src/render/ship.ts · buildShipMesh()',
    build: buildShipMesh,
  },
  {
    name: 'Seemine',
    desc: 'Ikosaeder mit Kegel-Spikes, zu einer Geometrie gemergt. Treibt unter unaufgedeckten Zellen.',
    src: 'src/render/mineGeometry.ts · mineGeometry()',
    build: mineMesh,
  },
  {
    name: 'Delfin',
    desc: 'Taucht in Gruppen von 3–5 Tieren porpoising durchs offene Wasser.',
    src: 'src/render/seaLife.ts · dolphinMesh()',
    build: dolphinMesh,
  },
  {
    name: 'Wal',
    desc: 'Seltenes Ambient-Event: taucht auf, bläst einmal und schlägt beim Abtauchen mit der Fluke.',
    src: 'src/render/seaLife.ts · whaleMesh()',
    build: whaleMesh,
  },
  {
    name: 'Fisch',
    desc: 'Springt in Schwärmen von 3–5 in flachen Bögen aus dem Wasser.',
    src: 'src/render/seaLife.ts · fishMesh()',
    build: fishMesh,
  },
  {
    name: 'Flagge',
    desc: 'Markierung für vermutete Minen — Mast und Tuch laufen im Spiel als getrennte Instanz-Layer.',
    src: 'src/render/boardView.ts · Flaggen-Layer',
    build: flagMesh,
  },
  {
    name: 'Leuchtboje',
    desc: 'Fahrwassertonne entlang der Schifffahrtsrouten — blinkt nachts sanft.',
    src: 'src/render/dayNight.ts · Bojen-Aufbau',
    build: buoyMesh,
  },
];

interface View {
  element: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pivot: THREE.Group;
  rotX: number;
  rotY: number;
  dragging: boolean;
}

const canvas = document.getElementById('gl') as HTMLCanvasElement;
const grid = document.getElementById('grid')!;
// preserveDrawingBuffer: Dev-Seite — erlaubt Canvas-Capture/Debugging
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setScissorTest(true);

const views: View[] = MODELS.map((def) => {
  const card = document.createElement('div');
  card.className = 'card';
  const viewEl = document.createElement('div');
  viewEl.className = 'view';
  const meta = document.createElement('div');
  meta.className = 'meta';
  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = def.name;
  const desc = document.createElement('div');
  desc.className = 'desc';
  desc.textContent = def.desc;
  const src = document.createElement('div');
  src.className = 'src';
  src.textContent = def.src;
  meta.append(name, desc, src);
  card.append(viewEl, meta);
  grid.append(card);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#bcd4ec', '#1a2c3e', 1.1));
  const key = new THREE.DirectionalLight('#ffe9c4', 2.0);
  key.position.set(2, 3, 2.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#7da4cc', 0.8);
  rim.position.set(-2.5, 1, -2);
  scene.add(rim);

  // Modell zentrieren und auf Einheitsgröße normieren, damit Fisch und Wal
  // gleich gut ins Bild passen
  const model = def.build();
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;
  model.position.sub(center);
  const pivot = new THREE.Group();
  pivot.add(model);
  pivot.scale.setScalar(1 / radius);
  scene.add(pivot);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0.6, 2.6);
  camera.lookAt(0, 0, 0);

  const view: View = { element: viewEl, scene, camera, pivot, rotX: 0.12, rotY: 0.6, dragging: false };

  viewEl.addEventListener('pointerdown', (e) => {
    view.dragging = true;
    viewEl.classList.add('dragging');
    viewEl.setPointerCapture(e.pointerId);
  });
  viewEl.addEventListener('pointermove', (e) => {
    if (!view.dragging) return;
    view.rotY += e.movementX * 0.012;
    view.rotX = THREE.MathUtils.clamp(view.rotX + e.movementY * 0.012, -1.2, 1.2);
  });
  const stop = () => {
    view.dragging = false;
    viewEl.classList.remove('dragging');
  };
  viewEl.addEventListener('pointerup', stop);
  viewEl.addEventListener('pointercancel', stop);

  return view;
});

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false);
  }
}

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  resize();
  renderer.setClearColor(0x000000, 0);

  for (const view of views) {
    const rect = view.element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight || rect.width === 0) continue;

    if (!view.dragging) view.rotY += dt * 0.5;
    view.pivot.rotation.set(view.rotX, view.rotY, 0);

    // Canvas ist fixed über dem Viewport → Viewport-Koordinaten direkt nutzbar
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    const x = Math.floor(rect.left);
    const y = Math.floor(window.innerHeight - rect.bottom);
    view.camera.aspect = width / height;
    view.camera.updateProjectionMatrix();
    renderer.setViewport(x, y, width, height);
    renderer.setScissor(x, y, width, height);
    renderer.render(view.scene, view.camera);
  }
  requestAnimationFrame(frame);
}
// Erster Frame synchron — rendert auch, wenn rAF (Hintergrund-Tab) gedrosselt ist
frame(performance.now());
