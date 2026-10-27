import type { GameInput } from '../game/types';

export const movementCodes = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ShiftLeft',
  'ShiftRight',
  'Space',
]);

export const createInputState = () => {
  const held = new Set<string>();
  let touchX = 0;
  let touchZ = 0;
  let queuedJump = false;
  const clear = () => {
    held.clear();
    touchX = 0;
    touchZ = 0;
    queuedJump = false;
  };
  const press = (code: string) => {
    if (code === 'Space' && !held.has(code)) queuedJump = true;
    held.add(code);
  };
  const release = (code: string) => {
    held.delete(code);
  };
  const setMove = (x: number, z: number) => {
    touchX = Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
    touchZ = Number.isFinite(z) ? Math.max(-1, Math.min(1, z)) : 0;
  };
  const jump = () => {
    queuedJump = true;
  };
  const read = (): GameInput => {
    const down = (...codes: string[]) => (codes.some((code) => held.has(code)) ? 1 : 0);
    const x = touchX + down('KeyD', 'ArrowRight') - down('KeyA', 'ArrowLeft');
    const z = touchZ + down('KeyS', 'ArrowDown') - down('KeyW', 'ArrowUp');
    const length = Math.max(1, Math.hypot(x, z));
    const input = {
      moveX: x / length,
      moveZ: z / length,
      jump: queuedJump,
      sprint: Boolean(down('ShiftLeft', 'ShiftRight')),
    };
    queuedJump = false;
    return input;
  };
  return { clear, press, release, setMove, jump, read };
};
