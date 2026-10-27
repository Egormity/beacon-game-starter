import {
  CylinderGeometry,
  Group,
  MeshBasicMaterial,
  OctahedronGeometry,
  TorusGeometry,
} from 'three';
import type { LevelDefinition } from '../game/types';
import { palette } from './palette';
import { material, mesh } from './primitives';
import type { RenderResources } from './resources';

export const createBeacon = (resources: RenderResources, goal: LevelDefinition['goal']) => {
  const group = new Group();
  group.position.set(goal.position.x, goal.position.y, goal.position.z);
  const base = material(resources, palette.ink);
  const pale = material(resources, palette.beacon);
  const light = material(resources, palette.mintDark, 0.35);
  const beamSurface = resources.track(
    new MeshBasicMaterial({
      color: palette.mint,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    }),
  );
  const rimSurface = resources.track(
    new MeshBasicMaterial({
      color: palette.mint,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );

  // The pad is a visual marker, not an obstacle; the game owns the goal's trigger radius.
  mesh(
    group,
    resources.track(new CylinderGeometry(goal.radius * 1.07, goal.radius * 1.1, 0.08, 32)),
    base,
    { x: 0, y: 0.045, z: 0 },
  );
  const groundRing = mesh(
    group,
    resources.track(new TorusGeometry(goal.radius * 0.86, 0.035, 6, 40)),
    light,
    { x: 0, y: 0.1, z: 0 },
  );
  groundRing.rotation.x = Math.PI / 2;
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const tick = mesh(group, resources.track(new CylinderGeometry(0.04, 0.04, 0.18, 4)), pale, {
      x: Math.sin(angle) * goal.radius * 0.98,
      y: 0.11,
      z: Math.cos(angle) * goal.radius * 0.98,
    });
    tick.rotation.z = Math.PI / 2;
    tick.rotation.y = angle;
  }

  const halo = mesh(group, resources.track(new TorusGeometry(0.88, 0.12, 8, 40)), pale, {
    x: 0,
    y: 3.6,
    z: 0,
  });
  const innerHalo = mesh(group, resources.track(new TorusGeometry(0.66, 0.035, 6, 40)), light, {
    x: 0,
    y: 3.6,
    z: 0.02,
  });
  const core = mesh(group, resources.track(new OctahedronGeometry(0.33)), light, {
    x: 0,
    y: 3.6,
    z: 0,
  });
  const beam = mesh(
    group,
    resources.track(new CylinderGeometry(0.7, 0.25, 7, 24, 1, true)),
    beamSurface,
    { x: 0, y: 3.5, z: 0 },
  );
  beam.castShadow = false;
  const outerRing = mesh(
    group,
    resources.track(new TorusGeometry(goal.radius * 1.15, 0.025, 4, 48)),
    rimSurface,
    { x: 0, y: 0.14, z: 0 },
  );
  outerRing.rotation.x = Math.PI / 2;
  beam.visible = false;
  outerRing.visible = false;

  return {
    group,
    update: (active: boolean, won: boolean, time: number, reducedMotion: boolean) => {
      light.color.setHex(active ? palette.mint : palette.mintDark);
      light.emissive.setHex(active ? palette.mint : palette.mintDark);
      light.emissiveIntensity = active ? 0.7 : 0.15;
      beam.visible = active;
      beamSurface.opacity = won ? 0.2 : 0.09;
      outerRing.visible = active;
      halo.rotation.z = reducedMotion ? 0 : Math.sin(time * 0.3) * 0.08;
      innerHalo.rotation.z = -halo.rotation.z;
      core.rotation.y = reducedMotion ? 0 : time * 0.55;
    },
  };
};
