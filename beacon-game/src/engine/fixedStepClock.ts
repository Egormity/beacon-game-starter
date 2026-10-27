export interface FrameTiming {
  alpha: number;
  delta: number;
  steps: number;
}

/** The simulation always receives a fixed dt; large gaps never create unlimited catch-up. */
export const createFixedStepClock = (step = 1 / 60, maxSteps = 6) => {
  let previous: number | undefined;
  let accumulated = 0;

  const reset = () => {
    previous = undefined;
    accumulated = 0;
  };
  const advance = (timestampMs: number, update: (dt: number) => void): FrameTiming => {
    if (previous === undefined) {
      previous = timestampMs;
      return { alpha: 0, delta: 0, steps: 0 };
    }
    const delta = Math.min(Math.max(0, (timestampMs - previous) / 1000), step * maxSteps);
    previous = timestampMs;
    accumulated += delta;
    let steps = 0;
    while (accumulated + Number.EPSILON >= step && steps < maxSteps) {
      update(step);
      accumulated = Math.max(0, accumulated - step);
      steps += 1;
    }
    // A stalled browser tab drops wall time rather than creating a spiral of deferred steps.
    if (accumulated >= step) accumulated %= step;
    return { alpha: Math.max(0, Math.min(1, accumulated / step)), delta, steps };
  };
  return { advance, reset };
};
