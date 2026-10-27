import { CapsuleGeometry, CylinderGeometry, Group, Mesh, SphereGeometry } from 'three';
import { palette } from './palette';
import { box, material, mesh } from './primitives';
import type { RenderResources } from './resources';

export const createPlayer = (resources: RenderResources) => {
  const group = new Group();
  const suit = material(resources, palette.amber);
  const ivory = material(resources, palette.ivory);
  const dark = material(resources, palette.ink, 0.35);
  const orange = material(resources, palette.amberDark);

  // The body dimensions match the physics capsule: radius .35, half-height .35.
  mesh(group, resources.track(new CapsuleGeometry(0.35, 0.7, 4, 10)), suit);
  const helmet = mesh(group, resources.track(new SphereGeometry(0.36, 12, 8)), ivory, {
    x: 0,
    y: 0.3,
    z: 0,
  });
  helmet.scale.set(1, 0.9, 1);
  const visor = box(
    resources,
    group,
    { x: 0.48, y: 0.2, z: 0.13 },
    { x: 0, y: 0.31, z: 0.31 },
    dark,
  );
  visor.rotation.x = -0.1;
  box(resources, group, { x: 0.4, y: 0.49, z: 0.18 }, { x: 0, y: -0.09, z: -0.34 }, orange);
  box(resources, group, { x: 0.25, y: 0.07, z: 0.04 }, { x: 0, y: -0.04, z: 0.34 }, ivory);

  const limbGeometry = resources.track(new CylinderGeometry(0.105, 0.12, 0.4, 7));
  const arms = [-1, 1].map((side) => {
    const arm = mesh(group, limbGeometry, suit, { x: side * 0.37, y: -0.08, z: 0 });
    arm.rotation.z = side * 0.12;
    return arm;
  });
  const feet: Mesh[] = [-1, 1].map((side) =>
    box(
      resources,
      group,
      { x: 0.22, y: 0.16, z: 0.32 },
      { x: side * 0.17, y: -0.62, z: 0.05 },
      dark,
    ),
  );
  const antenna = mesh(group, resources.track(new CylinderGeometry(0.025, 0.025, 0.22, 5)), dark, {
    x: 0.2,
    y: 0.69,
    z: -0.08,
  });
  antenna.rotation.z = -0.2;
  mesh(group, resources.track(new SphereGeometry(0.065, 6, 4)), suit, {
    x: 0.22,
    y: 0.8,
    z: -0.08,
  });

  return {
    group,
    animate: (time: number, moving: boolean, grounded: boolean, reducedMotion: boolean) => {
      const stride = moving && grounded && !reducedMotion ? Math.sin(time * 17) * 0.32 : 0;
      arms[0].rotation.x = stride;
      arms[1].rotation.x = -stride;
      feet[0].position.z = 0.05 + stride * 0.17;
      feet[1].position.z = 0.05 - stride * 0.17;
    },
  };
};
