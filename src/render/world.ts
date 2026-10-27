import {
  CircleGeometry,
  Group,
  MeshBasicMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  TorusGeometry,
} from 'three';
import type { LevelDefinition, GameSnapshot } from '../game/types';
import { createBeacon } from './beacon';
import { palette } from './palette';
import { box, material, mesh } from './primitives';
import type { RenderResources } from './resources';
import { createScenery } from './scenery';

export const createWorldView = (resources: RenderResources, level: LevelDefinition) => {
  const group = new Group();
  const groundTop = material(resources, palette.grass);
  const groundSide = material(resources, palette.soil);
  const groundBottom = material(resources, palette.soilLower);
  const stoneTop = material(resources, palette.stone);
  const stoneSide = material(resources, palette.stoneSide);
  const platformTop = material(resources, palette.platform);
  const platformSide = material(resources, palette.platformSide);
  const grass = material(resources, palette.grassLight);

  for (const solid of level.solids) {
    const top =
      solid.kind === 'ground' ? groundTop : solid.kind === 'platform' ? platformTop : stoneTop;
    const side =
      solid.kind === 'ground' ? groundSide : solid.kind === 'platform' ? platformSide : stoneSide;
    box(resources, group, solid.size, solid.position, [side, side, top, groundBottom, side, side]);
    if (solid.kind === 'ground') {
      // Decorative lower strata are beneath every walkable collider, never in the player's path.
      box(
        resources,
        group,
        { x: solid.size.x * 0.97, y: 1.2, z: solid.size.z * 0.97 },
        { ...solid.position, y: solid.position.y - solid.size.y / 2 - 0.6 },
        groundBottom,
      );
      const topY = solid.position.y + solid.size.y / 2 + 0.01;
      for (const xSign of [-1, 1]) {
        for (const zSign of [-1, 1]) {
          // Low grass flecks are cosmetic and intentionally not physical obstacles.
          for (let index = 0; index < 3; index += 1) {
            const blade = box(
              resources,
              group,
              { x: 0.05, y: 0.12 + index * 0.03, z: 0.035 },
              {
                x: solid.position.x + xSign * (solid.size.x / 2 - 0.4) + index * 0.08,
                y: topY + 0.06,
                z: solid.position.z + zSign * (solid.size.z / 2 - 0.4),
              },
              grass,
            );
            blade.rotation.z = (index - 1) * 0.3;
          }
        }
      }
    }
    if (solid.kind === 'platform') {
      const line = box(
        resources,
        group,
        { x: solid.size.x * 0.55, y: 0.015, z: 0.07 },
        {
          ...solid.position,
          y: solid.position.y + solid.size.y / 2 + 0.01,
        },
        stoneTop,
      );
      line.castShadow = false;
    }
    if (solid.kind === 'stone') {
      // These shallow markings stay inside the box collider's existing silhouette.
      const cap = box(
        resources,
        group,
        { x: solid.size.x - 0.12, y: 0.035, z: solid.size.z - 0.12 },
        { ...solid.position, y: solid.position.y + solid.size.y / 2 - 0.014 },
        groundTop,
      );
      cap.castShadow = false;
      const seam = box(
        resources,
        group,
        { x: solid.size.x, y: 0.025, z: solid.size.z + 0.002 },
        { ...solid.position, y: solid.position.y - solid.size.y * 0.12 },
        groundSide,
      );
      seam.castShadow = false;
    }
  }

  const ocean = mesh(
    group,
    resources.track(new PlaneGeometry(300, 300)),
    material(resources, palette.water, 0.5),
    { x: 0, y: -2.8, z: 0 },
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.castShadow = false;
  group.add(createScenery(resources));
  const waterLine = resources.track(
    new MeshBasicMaterial({
      color: palette.waterLine,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    }),
  );
  for (let index = 0; index < 6; index += 1) {
    const ripple = mesh(
      group,
      resources.track(new TorusGeometry(17 + index * 5, 0.025, 3, 80)),
      waterLine,
      { x: 0, y: -2.76, z: 0 },
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.scale.y = 0.75;
    ripple.castShadow = false;
  }

  const crystalSurface = material(resources, palette.mint, 0.25);
  crystalSurface.emissive.setHex(palette.mint);
  crystalSurface.emissiveIntensity = 0.5;
  const crystalGeometry = resources.track(new OctahedronGeometry(0.34));
  const haloGeometry = resources.track(new TorusGeometry(0.52, 0.018, 4, 24));
  const haloSurface = resources.track(
    new MeshBasicMaterial({ color: palette.mint, transparent: true, opacity: 0.7 }),
  );
  const shadowSurface = resources.track(
    new MeshBasicMaterial({
      color: palette.ink,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
    }),
  );
  const pickups = level.pickups.map((pickup, index) => {
    const root = new Group();
    root.position.set(pickup.position.x, pickup.position.y, pickup.position.z);
    group.add(root);
    const crystal = mesh(root, crystalGeometry, crystalSurface);
    const halo = mesh(root, haloGeometry, haloSurface, { x: 0, y: -0.1, z: 0 });
    halo.rotation.x = Math.PI / 2;
    halo.castShadow = false;
    const shadow = mesh(group, resources.track(new CircleGeometry(0.36, 20)), shadowSurface, {
      x: pickup.position.x,
      y: pickup.position.y - 0.88,
      z: pickup.position.z,
    });
    shadow.rotation.x = -Math.PI / 2;
    shadow.castShadow = false;
    return { id: pickup.id, root, crystal, shadow, baseY: pickup.position.y, phase: index * 1.4 };
  });

  const beacon = createBeacon(resources, level.goal);
  group.add(beacon.group);
  return {
    group,
    update: (snapshot: GameSnapshot, reducedMotion: boolean) => {
      const time = snapshot.elapsed;
      for (const pickup of pickups) {
        const visible = !snapshot.collectedIds.includes(pickup.id);
        pickup.root.visible = visible;
        pickup.shadow.visible = visible;
        pickup.root.position.y =
          pickup.baseY + (reducedMotion ? 0 : Math.sin(time * 2 + pickup.phase) * 0.09);
        pickup.crystal.rotation.y = reducedMotion ? Math.PI / 4 : time * 0.7 + pickup.phase;
      }
      beacon.update(
        snapshot.collectedIds.length === snapshot.totalPickups,
        snapshot.phase === 'won',
        time,
        reducedMotion,
      );
    },
  };
};
