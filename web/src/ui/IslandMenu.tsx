import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { LevelDefinition } from '../game/types';

interface Props {
  levels: readonly LevelDefinition[];
  level: LevelDefinition;
  onChange: (id: string) => void;
}

export const IslandMenu = ({ levels, level, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    return () => document.removeEventListener('pointerdown', handlePointer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const options = Array.from(
      menu.current?.querySelectorAll<HTMLButtonElement>('.island-option') ?? [],
    );
    const selected = options.find((option) => option.getAttribute('aria-checked') === 'true');
    (selected ?? options[0])?.focus();
  }, [open]);

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus();
  };

  const choose = (id: string) => {
    onChange(id);
    close();
  };

  return (
    <div className="island-menu" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="island-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="island-menu"
        aria-label={`Choose island: ${level.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="island-dot" aria-hidden="true" />
        <span className="island-name">{level.name}</span>
        <ChevronDown size={16} aria-hidden="true" className="island-chevron" />
      </button>
      {open && (
        <div
          id="island-menu"
          className="island-popover"
          role="menu"
          aria-label="Islands"
          ref={menu}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
              return;
            }
            if (event.key === 'Tab') {
              setOpen(false);
              return;
            }
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            const options = Array.from(
              menu.current?.querySelectorAll<HTMLButtonElement>('.island-option') ?? [],
            );
            if (options.length === 0) return;
            const index = options.indexOf(document.activeElement as HTMLButtonElement);
            const step = event.key === 'ArrowDown' ? 1 : -1;
            options[(index + step + options.length) % options.length]?.focus();
          }}
        >
          <p className="island-popover-title">Choose island</p>
          {levels.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="menuitemradio"
              aria-checked={entry.id === level.id}
              className="island-option"
              onClick={() => choose(entry.id)}
            >
              <span className="island-option-copy">
                <strong>{entry.name}</strong>
                <small>{entry.pickups.length} energy cells</small>
              </span>
              {entry.id === level.id && <Check size={17} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
