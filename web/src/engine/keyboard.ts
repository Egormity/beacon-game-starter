import { createInputState, movementCodes } from './inputState';

interface KeyboardOptions {
  canvas: HTMLCanvasElement;
  input: ReturnType<typeof createInputState>;
  isPlaying: () => boolean;
  pause: () => void;
  restart: () => void;
}

export const bindKeyboard = ({ canvas, input, isPlaying, pause, restart }: KeyboardOptions) => {
  const onDown = (event: KeyboardEvent) => {
    if (
      !isPlaying() ||
      document.activeElement !== canvas ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    if (!movementCodes.has(event.code) && event.code !== 'Escape' && event.code !== 'KeyR') return;
    event.preventDefault();
    if (event.code === 'Escape') {
      if (!event.repeat) pause();
      return;
    }
    if (event.code === 'KeyR') {
      if (!event.repeat) restart();
      return;
    }
    input.press(event.code);
  };
  // Key releases must be accepted even after focus leaves the canvas.
  const onUp = (event: KeyboardEvent) => input.release(event.code);
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    input.clear();
  };
};
