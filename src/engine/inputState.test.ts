import { describe, expect, it } from 'vitest';
import { createInputState } from './inputState';

describe('game actions', () => {
  it('consumes jump once per press even when the operating system repeats keydown', () => {
    const input = createInputState();
    input.press('Space');
    expect(input.read().jump).toBe(true);
    input.press('Space');
    expect(input.read().jump).toBe(false);
    input.release('Space');
    input.press('Space');
    expect(input.read().jump).toBe(true);
  });

  it('normalizes diagonal movement and preserves the opposite held key after release', () => {
    const input = createInputState();
    input.press('KeyW');
    input.press('KeyD');
    const diagonal = input.read();
    expect(Math.hypot(diagonal.moveX, diagonal.moveZ)).toBeCloseTo(1);
    input.press('KeyS');
    expect(input.read().moveZ).toBe(0);
    input.release('KeyS');
    expect(input.read().moveZ).toBeLessThan(0);
  });

  it('clears keyboard, touch, sprint, and pending jump together on focus loss', () => {
    const input = createInputState();
    input.press('KeyW');
    input.press('ShiftLeft');
    input.setMove(1, 0);
    input.jump();
    input.clear();
    expect(input.read()).toEqual({ moveX: 0, moveZ: 0, jump: false, sprint: false });
  });
});
