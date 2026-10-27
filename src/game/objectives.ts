import { movementConfig } from './config';
import type { LevelDefinition, Vec3 } from './types';

export const collectNearby = (level: LevelDefinition, position: Vec3, collected: Set<string>) => {
  for (const pickup of level.pickups) {
    if (collected.has(pickup.id)) continue;
    const distance = Math.hypot(
      position.x - pickup.position.x,
      position.y - pickup.position.y,
      position.z - pickup.position.z,
    );
    if (distance <= movementConfig.pickupRadius) collected.add(pickup.id);
  }
};

export const reachedGoal = (level: LevelDefinition, position: Vec3, collected: Set<string>) => {
  const goal = level.goal;
  const centerHeight = goal.position.y + movementConfig.radius + movementConfig.halfHeight;
  return (
    collected.size === level.pickups.length &&
    Math.hypot(position.x - goal.position.x, position.z - goal.position.z) <= goal.radius &&
    Math.abs(position.y - centerHeight) < 1
  );
};
