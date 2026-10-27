import { afterEach, describe, expect, it } from 'vitest';
import { movementConfig } from './config';
import { createSimulation } from './simulation';
import type { GameInput, GameSimulation, LevelDefinition } from './types';

const idle: GameInput = { moveX: 0, moveZ: 0, jump: false, sprint: false };
const fixture = (): LevelDefinition => ({
  id: 'test',
  name: 'Test level',
  description: 'Physics fixture',
  spawn: { x: 0, y: 0.75, z: 0 },
  goal: { position: { x: 10, y: 0, z: 10 }, radius: 1 },
  solids: [
    { id: 'ground', position: { x: 0, y: -1, z: 0 }, size: { x: 30, y: 2, z: 30 }, kind: 'ground' },
  ],
  pickups: [{ id: 'cell', position: { x: 8, y: 0.9, z: 8 } }],
  fallY: -8,
});
const active: GameSimulation[] = [];
const create = async (level = fixture()) => {
  const simulation = await createSimulation(level);
  active.push(simulation);
  return simulation;
};
const advance = (simulation: GameSimulation, count: number, input: Partial<GameInput> = {}) => {
  for (let frame = 0; frame < count; frame += 1)
    simulation.step({ ...idle, ...input }, movementConfig.fixedStep);
};
afterEach(() => {
  active.forEach((simulation) => simulation.dispose());
  active.length = 0;
});

describe('game simulation with real Rapier collisions', () => {
  it('starts only on command and normalizes diagonal movement', async () => {
    const straight = await create();
    advance(straight, 60, { moveX: 1 });
    expect(straight.snapshot().player.position.x).toBe(0);
    straight.start();
    advance(straight, 30);
    advance(straight, 60, { moveX: 1 });
    const straightPosition = straight.snapshot().player.position;
    expect(Math.abs(straightPosition.x - movementConfig.walkSpeed)).toBeLessThan(0.15);
    expect(straightPosition.y).toBeGreaterThanOrEqual(0.69);
    expect(straightPosition.y).toBeLessThan(0.76);
    const diagonal = await create();
    diagonal.start();
    advance(diagonal, 30);
    advance(diagonal, 60, { moveX: 1, moveZ: 1 });
    const diagonalPosition = diagonal.snapshot().player.position;
    expect(
      Math.abs(Math.hypot(diagonalPosition.x, diagonalPosition.z) - straightPosition.x),
    ).toBeLessThan(0.15);
  });

  it('slides against a solid wall rather than walking through it', async () => {
    const level = fixture();
    level.solids.push({
      id: 'wall',
      position: { x: 2, y: 2, z: 0 },
      size: { x: 1, y: 4, z: 12 },
      kind: 'stone',
    });
    const simulation = await create(level);
    simulation.start();
    advance(simulation, 120, { moveX: 1, moveZ: -0.4 });
    const position = simulation.snapshot().player.position;
    expect(position.x).toBeLessThan(1.16);
    expect(position.x).toBeGreaterThan(1.05);
    expect(position.z).toBeLessThan(-2);
  });

  it('jumps, lands, and does not auto-jump again while the action stays held', async () => {
    const simulation = await create();
    simulation.start();
    advance(simulation, 30);
    expect(simulation.snapshot().player.grounded).toBe(true);
    let peak = 0;
    for (let frame = 0; frame < 150; frame += 1) {
      simulation.step({ ...idle, jump: true }, movementConfig.fixedStep);
      peak = Math.max(peak, simulation.snapshot().player.position.y);
    }
    expect(peak).toBeGreaterThan(1.9);
    expect(simulation.snapshot().player.position.y).toBeLessThan(0.76);
    expect(simulation.snapshot().player.grounded).toBe(true);
  });

  it('freezes input and the clock while paused and resets the complete run on restart', async () => {
    const simulation = await create();
    simulation.start();
    advance(simulation, 30, { moveX: 1 });
    simulation.pause();
    const paused = simulation.snapshot();
    advance(simulation, 120, { moveZ: 1, jump: true });
    expect(simulation.snapshot()).toEqual(paused);
    simulation.resume();
    advance(simulation, 10, { moveZ: 1 });
    expect(simulation.snapshot().elapsed).toBeGreaterThan(paused.elapsed);
    simulation.restart();
    expect(simulation.snapshot()).toMatchObject({
      phase: 'playing',
      elapsed: 0,
      falls: 0,
      collectedIds: [],
    });
    expect(simulation.snapshot().player.position).toEqual(fixture().spawn);
    expect(simulation.snapshot().player.previousPosition).toEqual(fixture().spawn);
  });

  it('requires a cell before the goal and freezes the completed run', async () => {
    const level = fixture();
    level.goal.position = { x: 0, y: 0, z: 0 };
    level.goal.radius = 0.4;
    level.pickups[0].position = { x: 2, y: 0.9, z: 0 };
    const simulation = await create(level);
    simulation.start();
    advance(simulation, 30);
    expect(simulation.snapshot().phase).toBe('playing');
    advance(simulation, 25, { moveX: 1 });
    expect(simulation.snapshot().collectedIds).toEqual(['cell']);
    advance(simulation, 25, { moveX: -1 });
    expect(simulation.snapshot().phase).toBe('won');
    const completed = simulation.snapshot();
    advance(simulation, 60, { moveX: 1 });
    expect(simulation.snapshot()).toEqual(completed);
  });

  it('respawns after falling without losing cells or interpolating across the island', async () => {
    const level = fixture();
    level.solids[0].size = { x: 2, y: 2, z: 2 };
    level.pickups[0].position = { x: 0, y: 0.9, z: 0 };
    const simulation = await create(level);
    simulation.start();
    for (let frame = 0; frame < 180 && simulation.snapshot().falls === 0; frame += 1) {
      simulation.step({ ...idle, moveX: 1 }, movementConfig.fixedStep);
    }
    const state = simulation.snapshot();
    expect(state.falls).toBe(1);
    expect(state.collectedIds).toEqual(['cell']);
    expect(state.player.position).toEqual(level.spawn);
    expect(state.player.previousPosition).toEqual(level.spawn);
    simulation.dispose();
    simulation.dispose();
    expect(() => advance(simulation, 10)).not.toThrow();
  });
});
