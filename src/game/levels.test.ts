import { afterEach, describe, expect, it } from 'vitest';
import { movementConfig } from './config';
import { levels } from './levels';
import { createSimulation } from './simulation';
import { validateLevel } from './validateLevel';
import type { GameSimulation, LevelDefinition } from './types';

const active: GameSimulation[] = [];
afterEach(() => {
  active.forEach((simulation) => simulation.dispose());
  active.length = 0;
});
const stepToward = (simulation: GameSimulation, x: number, z: number, jump = false) => {
  const position = simulation.snapshot().player.position;
  const dx = x - position.x;
  const dz = z - position.z;
  const distance = Math.hypot(dx, dz);
  simulation.step(
    {
      moveX: distance > 0.1 ? dx / distance : 0,
      moveZ: distance > 0.1 ? dz / distance : 0,
      jump,
      sprint: false,
    },
    movementConfig.fixedStep,
  );
};
const walkTo = (simulation: GameSimulation, x: number, z: number) => {
  for (let frame = 0; frame < 300; frame += 1) {
    const position = simulation.snapshot().player.position;
    if (Math.hypot(x - position.x, z - position.z) < 0.13 || simulation.snapshot().phase === 'won')
      return;
    stepToward(simulation, x, z);
  }
  throw new Error(
    `Could not reach ${x}, ${z}: ${JSON.stringify(simulation.snapshot().player.position)}`,
  );
};
const jumpTo = (simulation: GameSimulation, x: number, z: number) => {
  for (let frame = 0; frame < 60; frame += 1) stepToward(simulation, x, z, frame === 0);
};
const start = async (level: LevelDefinition) => {
  const simulation = await createSimulation(level);
  active.push(simulation);
  simulation.start();
  for (let frame = 0; frame < 30; frame += 1) stepToward(simulation, level.spawn.x, level.spawn.z);
  return simulation;
};

describe('declarative levels', () => {
  it('validates object identities, finite coordinates, dimensions, and fall bounds', () => {
    levels.forEach((level) => expect(() => validateLevel(level)).not.toThrow());
    const duplicate = structuredClone(levels[0]);
    duplicate.pickups[0].id = duplicate.solids[0].id;
    expect(() => validateLevel(duplicate)).toThrow('unique');
    const dimensions = structuredClone(levels[0]);
    dimensions.solids[0].size.x = 0;
    expect(() => validateLevel(dimensions)).toThrow('positive');
    const invalidPosition = structuredClone(levels[0]);
    invalidPosition.spawn.x = Number.NaN;
    expect(() => validateLevel(invalidPosition)).toThrow('finite');
    const badGoal = structuredClone(levels[0]);
    badGoal.goal.radius = -1;
    expect(() => validateLevel(badGoal)).toThrow('positive');
    const badBoundary = structuredClone(levels[0]);
    badBoundary.fallY = 0;
    expect(() => validateLevel(badBoundary)).toThrow('Fall boundary');
  });

  it('can complete Relay island through movement and a real jump onto its raised ruin', async () => {
    const simulation = await start(levels[0]);
    walkTo(simulation, -7, 4);
    walkTo(simulation, 7, 4);
    walkTo(simulation, 6, -1.1);
    jumpTo(simulation, 6, -4);
    expect(simulation.snapshot().collectedIds).toContain('ruin-cell');
    walkTo(simulation, -6, -4);
    walkTo(simulation, 0, -7);
    expect(simulation.snapshot()).toMatchObject({ phase: 'won', falls: 0, totalPickups: 4 });
  });

  it('can complete Sky steps by jumping the gaps without falling', async () => {
    const simulation = await start(levels[1]);
    walkTo(simulation, -2, 6);
    walkTo(simulation, -2, 4.8);
    jumpTo(simulation, -2, 2);
    walkTo(simulation, -3, 1);
    walkTo(simulation, 0, -0.2);
    jumpTo(simulation, 0, -3);
    walkTo(simulation, 3, -4);
    walkTo(simulation, 0, -6.4);
    jumpTo(simulation, 0, -9.2);
    walkTo(simulation, -2, -10);
    walkTo(simulation, 0, -10);
    expect(simulation.snapshot()).toMatchObject({ phase: 'won', falls: 0, totalPickups: 4 });
  });
});
