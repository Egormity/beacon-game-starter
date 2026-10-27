import { describe, expect, it } from 'vitest';
import { createFixedStepClock } from './fixedStepClock';

describe('fixed-step time', () => {
  it('advances the same simulated second at 30, 60, and 144 rendered frames per second', () => {
    for (const fps of [30, 60, 144]) {
      const clock = createFixedStepClock();
      let simulated = 0;
      const update = (dt: number) => {
        expect(dt).toBe(1 / 60);
        simulated += dt;
      };
      clock.advance(0, update);
      for (let index = 1; index <= fps; index += 1) clock.advance((index * 1000) / fps, update);
      expect(simulated).toBeCloseTo(1, 8);
    }
  });

  it('limits catch-up after a stalled tab and does not defer a backlog', () => {
    const clock = createFixedStepClock();
    let updates = 0;
    const update = () => {
      updates += 1;
    };
    clock.advance(0, update);
    const recovered = clock.advance(60_000, update);
    expect(updates).toBe(6);
    expect(recovered.steps).toBe(6);
    expect(recovered.alpha).toBeLessThan(1);
    expect(clock.advance(60_000, update).steps).toBe(0);
  });

  it('forgets paused time and preserves interpolation between fixed steps', () => {
    const clock = createFixedStepClock();
    const update = () => undefined;
    clock.advance(0, update);
    expect(clock.advance(1000 / 120, update).alpha).toBeCloseTo(0.5);
    clock.reset();
    expect(clock.advance(30_000, update)).toEqual({ alpha: 0, delta: 0, steps: 0 });
    expect(clock.advance(30_000 + 1000 / 60, update).steps).toBe(1);
  });
});
