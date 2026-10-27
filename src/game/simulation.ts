import { movementConfig } from './config';
import { collectNearby, reachedGoal } from './objectives';
import { createPhysics } from './physics';
import { validateLevel } from './validateLevel';
import type { GameInput, GamePhase, GameSimulation } from './types';
import type { LevelDefinition } from './types';

export const createSimulation = async (level: LevelDefinition): Promise<GameSimulation> => {
  validateLevel(level);
  const physics = await createPhysics(level);
  const collected = new Set<string>();
  let phase: GamePhase = 'ready';
  let position = { ...level.spawn };
  let previousPosition = { ...position };
  let grounded = false;
  let verticalVelocity = 0;
  let yaw = Math.PI;
  let jumpHeld = false;
  let elapsed = 0;
  let falls = 0;
  let disposed = false;

  const respawn = () => {
    position = { ...level.spawn };
    previousPosition = { ...position };
    verticalVelocity = 0;
    grounded = false;
    jumpHeld = false;
    physics.teleport(position);
  };

  const step = (input: GameInput, dt: number) => {
    if (disposed || phase !== 'playing') return;
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05)
      throw new Error('Simulation steps require a bounded positive timestep.');
    elapsed += dt;
    previousPosition = { ...position };
    let x = Number.isFinite(input.moveX) ? Math.max(-1, Math.min(1, input.moveX)) : 0;
    let z = Number.isFinite(input.moveZ) ? Math.max(-1, Math.min(1, input.moveZ)) : 0;
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    if (length > 0.01) yaw = Math.atan2(x, z);
    if (input.jump && !jumpHeld && grounded) verticalVelocity = movementConfig.jumpSpeed;
    jumpHeld = input.jump;
    verticalVelocity = Math.max(
      movementConfig.terminalVelocity,
      verticalVelocity + movementConfig.gravity * dt,
    );
    const speed = input.sprint ? movementConfig.sprintSpeed : movementConfig.walkSpeed;
    const result = physics.move(
      { x: x * speed * dt, y: verticalVelocity * dt, z: z * speed * dt },
      dt,
    );
    position = result.position;
    grounded = result.grounded;
    if (
      (grounded && verticalVelocity < 0) ||
      (verticalVelocity > 0 && result.corrected.y < verticalVelocity * dt - 0.001)
    ) {
      verticalVelocity = 0;
    }
    if (position.y < level.fallY) {
      falls += 1;
      respawn();
      return;
    }
    collectNearby(level, position, collected);
    if (reachedGoal(level, position, collected)) phase = 'won';
  };

  return {
    step,
    start: () => {
      if (!disposed && phase === 'ready') phase = 'playing';
    },
    pause: () => {
      if (!disposed && phase === 'playing') {
        phase = 'paused';
        jumpHeld = false;
      }
    },
    resume: () => {
      if (!disposed && phase === 'paused') phase = 'playing';
    },
    restart: () => {
      if (disposed) return;
      collected.clear();
      elapsed = 0;
      falls = 0;
      yaw = Math.PI;
      respawn();
      phase = 'playing';
    },
    snapshot: () => ({
      phase,
      levelId: level.id,
      player: {
        position: { ...position },
        previousPosition: { ...previousPosition },
        yaw,
        grounded,
      },
      collectedIds: [...collected],
      totalPickups: level.pickups.length,
      elapsed,
      falls,
    }),
    dispose: () => {
      if (!disposed) {
        disposed = true;
        physics.dispose();
      }
    },
  };
};
