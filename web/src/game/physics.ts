import RAPIER from '@dimforge/rapier3d-compat';
import { movementConfig } from './config';
import type { LevelDefinition, Vec3 } from './types';

let initialization: Promise<void> | undefined;

export const createPhysics = async (level: LevelDefinition) => {
  initialization ??= RAPIER.init().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
  const world = new RAPIER.World({ x: 0, y: movementConfig.gravity, z: 0 });
  world.timestep = movementConfig.fixedStep;
  try {
    level.solids.forEach((solid) => {
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          solid.size.x / 2,
          solid.size.y / 2,
          solid.size.z / 2,
        ).setTranslation(solid.position.x, solid.position.y, solid.position.z),
      );
    });
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        level.spawn.x,
        level.spawn.y,
        level.spawn.z,
      ),
    );
    const collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(movementConfig.halfHeight, movementConfig.radius),
      body,
    );
    const controller = world.createCharacterController(movementConfig.contactOffset);
    controller.setNormalNudgeFactor(movementConfig.normalNudge);
    controller.enableAutostep(0.2, 0.25, false);
    // Gravity handles landings. Optional snapping caused capsule penetration on large flat boxes.
    controller.setSlideEnabled(true);
    world.step();
    let disposed = false;
    return {
      position: (): Vec3 => ({ ...body.translation() }),
      move: (translation: Vec3, dt: number) => {
        world.timestep = dt;
        const from = body.translation();
        controller.computeColliderMovement(collider, translation);
        const corrected = controller.computedMovement();
        body.setNextKinematicTranslation({
          x: from.x + corrected.x,
          y: from.y + corrected.y,
          z: from.z + corrected.z,
        });
        world.step();
        return {
          position: { ...body.translation() },
          grounded: controller.computedGrounded(),
          corrected,
        };
      },
      teleport: (position: Vec3) => {
        body.setTranslation(position, true);
        body.setNextKinematicTranslation(position);
        world.propagateModifiedBodyPositionsToColliders();
      },
      dispose: () => {
        if (disposed) return;
        disposed = true;
        world.free();
      },
    };
  } catch (error) {
    world.free();
    throw error;
  }
};
