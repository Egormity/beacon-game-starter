import type { GameSnapshot, LevelDefinition } from '../game/types';
import { createSimulation } from '../game/simulation';
import { movementConfig } from '../game/config';
import { createGameRenderer } from '../render/renderer';
import { createFixedStepClock } from './fixedStepClock';
import { createInputState } from './inputState';
import { bindKeyboard } from './keyboard';

export interface GameOptions {
  level: LevelDefinition;
  lowQuality: boolean;
  reducedMotion: boolean;
  onError: (message: string) => void;
  signal?: AbortSignal;
}

export interface GameHandle {
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  dispose: () => void;
  setQuality: (low: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setMove: (x: number, z: number) => void;
  jump: () => void;
  snapshot: () => GameSnapshot;
}

const aborted = () => new DOMException('Game startup was cancelled.', 'AbortError');

/** Composes the simulation, renderer, and browser adapters. This owns the only frame loop. */
export const createGame = async (
  canvas: HTMLCanvasElement,
  onSnapshot: (snapshot: GameSnapshot) => void,
  options: GameOptions,
): Promise<GameHandle> => {
  const { signal } = options;
  if (signal?.aborted) throw aborted();
  let simulation: Awaited<ReturnType<typeof createSimulation>>;
  try {
    simulation = await createSimulation(options.level);
  } catch (error) {
    if (signal?.aborted) throw aborted();
    options.onError('The physics engine could not start. Try loading the game again.');
    throw error;
  }
  if (signal?.aborted) {
    simulation.dispose();
    throw aborted();
  }
  let view: ReturnType<typeof createGameRenderer>;
  try {
    view = createGameRenderer(canvas, options.level, options);
  } catch (error) {
    simulation.dispose();
    options.onError(
      'This game needs WebGL 2 graphics. Check browser graphics support, then try again.',
    );
    throw error;
  }

  const input = createInputState();
  const clock = createFixedStepClock(movementConfig.fixedStep);
  let disposed = false;
  let faulted = false;
  let frame = 0;
  let lastHud = -Infinity;
  let lastSignature = '';
  let current = simulation.snapshot();
  const isPlaying = () => !disposed && !faulted && current.phase === 'playing';
  const publish = (snapshot: GameSnapshot, now = performance.now(), force = false) => {
    current = snapshot;
    const signature = `${snapshot.phase}:${snapshot.levelId}:${snapshot.collectedIds.join(',')}:${snapshot.falls}`;
    if (force || signature !== lastSignature || now - lastHud >= 100) {
      lastHud = now;
      lastSignature = signature;
      onSnapshot(snapshot);
    }
  };
  const stopFrame = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    clock.reset();
  };
  const drawStill = () => {
    if (!disposed && !faulted) view.render(simulation.snapshot(), 1, 0);
  };
  const reportFailure = (message: string) => {
    if (disposed || faulted) return;
    faulted = true;
    stopFrame();
    input.clear();
    simulation.pause();
    publish(simulation.snapshot(), performance.now(), true);
    options.onError(message);
  };
  const animate = (now: number) => {
    frame = 0;
    if (!isPlaying()) return;
    try {
      const timing = clock.advance(now, (dt) => simulation.step(input.read(), dt));
      const snapshot = simulation.snapshot();
      view.render(snapshot, snapshot.phase === 'playing' ? timing.alpha : 1, timing.delta);
      publish(snapshot, now);
      if (snapshot.phase === 'playing') frame = requestAnimationFrame(animate);
      else {
        input.clear();
        clock.reset();
      }
    } catch {
      reportFailure('The game stopped unexpectedly. Reload this level to try again.');
    }
  };
  const schedule = () => {
    if (!frame && isPlaying()) frame = requestAnimationFrame(animate);
  };
  const activate = (action: () => void) => {
    if (disposed || faulted) return;
    stopFrame();
    input.clear();
    action();
    canvas.focus({ preventScroll: true });
    publish(simulation.snapshot(), performance.now(), true);
    drawStill();
    schedule();
  };
  const pause = () => {
    if (disposed) return;
    stopFrame();
    input.clear();
    simulation.pause();
    publish(simulation.snapshot(), performance.now(), true);
    drawStill();
  };
  const restart = () => activate(simulation.restart);
  const removeKeyboard = bindKeyboard({ canvas, input, isPlaying, pause, restart });
  const onVisibility = () => {
    if (document.hidden) pause();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    reportFailure('The graphics context was lost. Reload this level to restore the scene.');
  };
  const onResize = () => {
    if (disposed || faulted) return;
    try {
      view.resize();
      if (!isPlaying()) drawStill();
    } catch {
      reportFailure('The scene could not resize. Reload this level to try again.');
    }
  };
  const observer = new ResizeObserver(onResize);
  observer.observe(canvas);
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('blur', input.clear);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    stopFrame();
    removeKeyboard();
    observer.disconnect();
    window.removeEventListener('blur', pause);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('blur', input.clear);
    signal?.removeEventListener('abort', dispose);
    try {
      view.dispose();
    } finally {
      simulation.dispose();
    }
  };
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) {
    dispose();
    throw aborted();
  }
  try {
    view.resize();
    drawStill();
    publish(simulation.snapshot(), performance.now(), true);
  } catch (error) {
    dispose();
    options.onError('The game could not display its first frame. Try loading the level again.');
    throw error;
  }

  return {
    start: () => activate(simulation.start),
    pause,
    resume: () => activate(simulation.resume),
    restart,
    dispose,
    setQuality: (low) => {
      if (!disposed && !faulted) {
        view.setQuality(low);
        drawStill();
      }
    },
    setReducedMotion: (reduced) => {
      if (!disposed && !faulted) {
        view.setReducedMotion(reduced);
        drawStill();
      }
    },
    setMove: (x, z) => {
      if (isPlaying()) input.setMove(x, z);
    },
    jump: () => {
      if (isPlaying()) input.jump();
    },
    snapshot: simulation.snapshot,
  };
};
