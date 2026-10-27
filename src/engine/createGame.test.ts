import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSimulation } from '../game/simulation';
import type { GameSimulation, GameSnapshot, LevelDefinition } from '../game/types';
import { createGameRenderer } from '../render/renderer';
import { createGame } from './createGame';

vi.mock('../game/simulation', () => ({ createSimulation: vi.fn() }));
vi.mock('../render/renderer', () => ({ createGameRenderer: vi.fn() }));

const level: LevelDefinition = {
  id: 'test',
  name: 'Test',
  description: '',
  spawn: { x: 0, y: 1, z: 0 },
  goal: { position: { x: 2, y: 1, z: 0 }, radius: 1 },
  solids: [],
  pickups: [],
  fallY: -10,
};

const makeSimulation = (): GameSimulation => {
  const state: GameSnapshot = {
    phase: 'ready',
    levelId: 'test',
    player: { position: level.spawn, previousPosition: level.spawn, yaw: 0, grounded: true },
    collectedIds: [],
    totalPickups: 0,
    elapsed: 0,
    falls: 0,
  };
  return {
    step: vi.fn(),
    start: vi.fn(() => {
      state.phase = 'playing';
    }),
    pause: vi.fn(() => {
      state.phase = 'paused';
    }),
    resume: vi.fn(() => {
      state.phase = 'playing';
    }),
    restart: vi.fn(() => {
      state.phase = 'playing';
    }),
    snapshot: () => ({ ...state }),
    dispose: vi.fn(),
  };
};

const makeRenderer = () => ({
  render: vi.fn(),
  resize: vi.fn(),
  setQuality: vi.fn(),
  setReducedMotion: vi.fn(),
  stats: () => ({ drawCalls: 0, triangles: 0 }),
  dispose: vi.fn(),
});
const makeCanvas = () =>
  Object.assign(new EventTarget(), { focus: vi.fn() }) as unknown as HTMLCanvasElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal(
    'document',
    Object.assign(new EventTarget(), { hidden: false, activeElement: null }),
  );
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 1),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('game lifecycle ownership', () => {
  it('frees a physics world that finishes loading after its host was unmounted', async () => {
    const simulation = makeSimulation();
    let finish!: (value: GameSimulation) => void;
    vi.mocked(createSimulation).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const controller = new AbortController();
    const onError = vi.fn();
    const pending = createGame(makeCanvas(), vi.fn(), {
      level,
      lowQuality: false,
      reducedMotion: false,
      onError,
      signal: controller.signal,
    });
    controller.abort();
    finish(simulation);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(simulation.dispose).toHaveBeenCalledOnce();
    expect(createGameRenderer).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('owns frame scheduling and removes listeners when disposed more than once', async () => {
    const simulation = makeSimulation();
    const renderer = makeRenderer();
    vi.mocked(createSimulation).mockResolvedValue(simulation);
    vi.mocked(createGameRenderer).mockReturnValue(renderer);
    const game = await createGame(makeCanvas(), vi.fn(), {
      level,
      lowQuality: false,
      reducedMotion: false,
      onError: vi.fn(),
    });
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    game.start();
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event('blur'));
    expect(simulation.pause).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
    game.dispose();
    game.dispose();
    window.dispatchEvent(new Event('blur'));
    expect(simulation.pause).toHaveBeenCalledOnce();
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(simulation.dispose).toHaveBeenCalledOnce();
  });

  it('releases both owners if rendering the initial scene fails', async () => {
    const simulation = makeSimulation();
    const renderer = makeRenderer();
    renderer.render.mockImplementation(() => {
      throw new Error('GPU unavailable');
    });
    vi.mocked(createSimulation).mockResolvedValue(simulation);
    vi.mocked(createGameRenderer).mockReturnValue(renderer);
    const onError = vi.fn();
    await expect(
      createGame(makeCanvas(), vi.fn(), {
        level,
        lowQuality: false,
        reducedMotion: false,
        onError,
      }),
    ).rejects.toThrow('GPU unavailable');
    expect(renderer.dispose).toHaveBeenCalledOnce();
    expect(simulation.dispose).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledOnce();
  });
});
