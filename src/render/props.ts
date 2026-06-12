import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Geteilte Requisiten: Flaggen-Geometrien (boardView, instanced) und
 * Leuchtboje (dayNight + Dev-Modellübersicht). Geometrien werden gecacht,
 * Bojen-Teile sind pro Material gemergt, um Draw-Calls niedrig zu halten.
 */

let poleGeo: THREE.BufferGeometry | null = null;

/** Flaggenmast mit Knauf, am Zellenrand versetzt (gemergt für Instancing). */
export function flagPoleGeometry(): THREE.BufferGeometry {
  if (poleGeo) return poleGeo;
  const pole = new THREE.CylinderGeometry(0.018, 0.024, 0.55, 6);
  pole.translate(-0.08, 0.27, 0);
  const knob = new THREE.SphereGeometry(0.03, 8, 6);
  knob.translate(-0.08, 0.555, 0);
  poleGeo = mergeGeometries([pole, knob]);
  return poleGeo;
}

let clothGeo: THREE.BufferGeometry | null = null;

/** Flaggentuch: Plane mit Wellenschlag, freies Ende hängt leicht durch. */
export function flagClothGeometry(): THREE.BufferGeometry {
  if (clothGeo) return clothGeo;
  const geo = new THREE.PlaneGeometry(0.3, 0.18, 8, 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = (pos.getX(i) + 0.15) / 0.3; // 0 = am Mast, 1 = freies Ende
    pos.setZ(i, Math.sin(k * Math.PI * 2.2) * 0.028 * k);
    pos.setY(i, pos.getY(i) - k * 0.025);
  }
  geo.computeVertexNormals();
  geo.translate(0.07, 0.43, 0);
  clothGeo = geo;
  return clothGeo;
}

interface BuoyGeos {
  hull: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  bulb: THREE.BufferGeometry;
}

let buoyGeos: BuoyGeos | null = null;

function getBuoyGeos(): BuoyGeos {
  if (buoyGeos) return buoyGeos;

  // Rote Teile: Schwimmkörper, Rumpfkegel, Mast-Dreibein
  const float = new THREE.CylinderGeometry(0.17, 0.22, 0.12, 12);
  float.translate(0, 0.06, 0);
  const cone = new THREE.CylinderGeometry(0.09, 0.21, 0.34, 12);
  cone.translate(0, 0.29, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const legs: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const bottom = new THREE.Vector3(Math.cos(a) * 0.07, 0.45, Math.sin(a) * 0.07);
    const dir = new THREE.Vector3(0, 0.74, 0).sub(bottom);
    const leg = new THREE.CylinderGeometry(0.011, 0.011, dir.length(), 5);
    leg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()));
    const mid = bottom.clone().addScaledVector(dir, 0.5);
    leg.translate(mid.x, mid.y, mid.z);
    legs.push(leg);
  }
  const hull = mergeGeometries([float, cone, ...legs]);

  // Weiße Teile: Kennband am Rumpf + Schutzring um die Laterne
  const band = new THREE.CylinderGeometry(0.175, 0.205, 0.09, 12);
  band.translate(0, 0.2, 0);
  const cage = new THREE.TorusGeometry(0.085, 0.012, 6, 14);
  cage.rotateX(Math.PI / 2);
  cage.translate(0, 0.78, 0);
  const trim = mergeGeometries([band, cage]);

  const bulb = new THREE.SphereGeometry(0.085, 10, 8);
  bulb.translate(0, 0.78, 0);

  buoyGeos = { hull, trim, bulb };
  return buoyGeos;
}

const buoyHullMat = new THREE.MeshStandardMaterial({ color: '#b3402a', roughness: 0.8 });
const buoyTrimMat = new THREE.MeshStandardMaterial({ color: '#e6e9ec', roughness: 0.6 });

/** Fahrwassertonne; die Laterne bekommt das übergebene (Emissive-)Material. */
export function buildBuoyMesh(bulbMat: THREE.Material): THREE.Group {
  const { hull, trim, bulb } = getBuoyGeos();
  const g = new THREE.Group();
  g.add(
    new THREE.Mesh(hull, buoyHullMat),
    new THREE.Mesh(trim, buoyTrimMat),
    new THREE.Mesh(bulb, bulbMat),
  );
  return g;
}
