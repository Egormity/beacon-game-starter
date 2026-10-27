import { ConeGeometry, CylinderGeometry, Group } from 'three';
import { palette } from './palette';
import { material, mesh } from './primitives';
import type { RenderResources } from './resources';

/** Distant set dressing sits beyond the playable islands and has no gameplay collider. */
export const createScenery = (resources: RenderResources) => {
  const group = new Group();
  const rock = material(resources, palette.soilLower);
  const bark = material(resources, palette.soil);
  const foliage = material(resources, 0x507b6a);
  const rockGeometry = resources.track(new ConeGeometry(1.65, 3.4, 5));
  const trunkGeometry = resources.track(new CylinderGeometry(0.1, 0.14, 1.2, 5));
  const leavesGeometry = resources.track(new ConeGeometry(0.95, 2.2, 6));
  for (const [x, z, scale] of [
    [-20, -14, 1],
    [22, -18, 1.25],
    [-24, -23, 0.75],
  ]) {
    const island = new Group();
    island.position.set(x, 0, z);
    island.scale.setScalar(scale);
    const base = mesh(island, rockGeometry, rock, { x: 0, y: -2.05, z: 0 });
    base.rotation.y = x * 0.2;
    mesh(island, trunkGeometry, bark, { x: 0, y: -0.05, z: 0 });
    const leaves = mesh(island, leavesGeometry, foliage, { x: 0, y: 1, z: 0 });
    leaves.rotation.y = z;
    group.add(island);
  }
  return group;
};
