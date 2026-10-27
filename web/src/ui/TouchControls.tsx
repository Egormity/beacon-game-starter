import { useEffect, useRef, type PointerEvent } from 'react';
import { ArrowUp } from 'lucide-react';

interface Props {
  move: (x: number, z: number) => void;
  jump: () => void;
  disabled: boolean;
}
export const TouchControls = ({ move, jump, disabled }: Props) => {
  const pad = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const update = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.35);
    const z = (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.35);
    const length = Math.max(1, Math.hypot(x, z));
    move(x / length, z / length);
    event.currentTarget.style.setProperty('--stick-x', `${(x / length) * 25}px`);
    event.currentTarget.style.setProperty('--stick-y', `${(z / length) * 25}px`);
  };
  const clear = () => {
    pointer.current = null;
    move(0, 0);
    pad.current?.style.setProperty('--stick-x', '0px');
    pad.current?.style.setProperty('--stick-y', '0px');
  };
  useEffect(() => {
    if (disabled) clear();
  }, [disabled]);
  return (
    <div className="touch-controls" aria-label="Touch game controls" hidden={disabled}>
      <div
        ref={pad}
        className="touch-stick"
        aria-label="Drag to move"
        role="group"
        onPointerDown={(event) => {
          if (disabled || pointer.current !== null) return;
          event.preventDefault();
          pointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          update(event);
        }}
        onPointerMove={(event) => {
          if (pointer.current === event.pointerId) update(event);
        }}
        onPointerUp={(event) => {
          if (pointer.current === event.pointerId) clear();
        }}
        onPointerCancel={clear}
        onLostPointerCapture={clear}
      >
        <span className="stick-cross">＋</span>
        <span className="stick-knob" />
        <span className="stick-label">MOVE</span>
      </div>
      <button
        type="button"
        className="touch-jump"
        aria-label="Jump"
        onPointerDown={(event) => {
          event.preventDefault();
          jump();
        }}
        onClick={(event) => {
          if (event.detail === 0) jump();
        }}
      >
        <ArrowUp size={24} />
        <span>JUMP</span>
      </button>
    </div>
  );
};
