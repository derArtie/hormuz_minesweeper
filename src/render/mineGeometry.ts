import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Stachelige Seeminen-Geometrie (Ikosaeder + Kegel-Spikes, gemergt). */
export function mineGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [new THREE.IcosahedronGeometry(0.24, 1)];
  const spike = () => new THREE.ConeGeometry(0.055, 0.16, 5);
  const dirs: [number, number, number][] = [
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0.7, 0.7, 0],
    [-0.7, 0.7, 0],
  ];
  const up = new THREE.Vector3(0, 1, 0);
  for (const [x, y, z] of dirs) {
    const dir = new THREE.Vector3(x, y, z).normalize();
    const g = spike();
    g.translate(0, 0.28, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir));
    // Icosahedron ist non-indexed → alle Teile angleichen, sonst schlägt der Merge fehl
    parts.push(g.toNonIndexed());
  }
  return mergeGeometries(parts);
}
