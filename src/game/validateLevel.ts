import type { LevelDefinition, Vec3 } from './types';

const finiteVector = (value: Vec3, label: string) => {
  if (!value || ![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new Error(`${label} must contain finite x, y and z coordinates.`);
  }
};

export const validateLevel = (level: LevelDefinition): void => {
  if (!level.id?.trim() || !level.name?.trim()) throw new Error('A level needs an id and name.');
  finiteVector(level.spawn, 'Spawn');
  finiteVector(level.goal?.position, 'Goal');
  if (!Number.isFinite(level.goal.radius) || level.goal.radius <= 0) {
    throw new Error('Goal radius must be positive and finite.');
  }
  if (!Array.isArray(level.solids) || level.solids.length === 0 || !Array.isArray(level.pickups)) {
    throw new Error('A level needs at least one solid and a pickup list.');
  }
  const ids = new Set<string>();
  const unique = (id: string) => {
    if (!id?.trim() || ids.has(id))
      throw new Error(`Level object ids must be nonempty and unique: ${id}`);
    ids.add(id);
  };
  level.solids.forEach((solid) => {
    unique(solid.id);
    finiteVector(solid.position, `Solid ${solid.id} position`);
    finiteVector(solid.size, `Solid ${solid.id} size`);
    if (Math.min(solid.size.x, solid.size.y, solid.size.z) <= 0)
      throw new Error('Solid sizes must be positive.');
    if (!['ground', 'stone', 'platform'].includes(solid.kind))
      throw new Error('Unknown solid kind.');
  });
  level.pickups.forEach((pickup) => {
    unique(pickup.id);
    finiteVector(pickup.position, `Pickup ${pickup.id}`);
  });
  const lowestSurface = Math.min(
    level.spawn.y,
    ...level.solids.map((solid) => solid.position.y - solid.size.y / 2),
  );
  if (!Number.isFinite(level.fallY) || level.fallY >= lowestSurface) {
    throw new Error('Fall boundary must be finite and below the level geometry and spawn.');
  }
};
