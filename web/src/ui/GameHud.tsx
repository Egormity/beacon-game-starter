import { Pause, RotateCcw, Timer } from 'lucide-react';
import type { GamePhase, LevelDefinition } from '../game/types';
import { formatTime } from './preferences';

interface Props {
  level: LevelDefinition;
  collected: number;
  phase: GamePhase;
  elapsed: number;
  onPause: () => void;
  onRestart: () => void;
}

export const GameHud = ({ level, collected, phase, elapsed, onPause, onRestart }: Props) => {
  const total = level.pickups.length;
  const complete = collected >= total;
  const progress = total === 0 ? 0 : Math.min(1, collected / total);
  const goal =
    phase === 'won'
      ? 'Signal restored'
      : complete
        ? 'Return to the beacon'
        : 'Collect the energy cells';

  return (
    <div className="game-hud">
      <div className={complete ? 'hud-mission is-complete' : 'hud-mission'}>
        <p className="hud-goal">
          <span className="hud-dot" aria-hidden="true" />
          {goal}
        </p>
        <div className="hud-progress">
          <span className="hud-track" aria-hidden="true">
            <span className="hud-fill" style={{ width: `${progress * 100}%` }} />
          </span>
          <span className="hud-count" aria-label={`${collected} of ${total} energy cells`}>
            <b data-testid="collected">{collected}</b> / {total}
          </span>
        </div>
      </div>
      <div className="hud-controls">
        <span className="timer" aria-label={`Time ${formatTime(elapsed)}`}>
          <Timer size={16} aria-hidden="true" />
          {formatTime(elapsed)}
        </span>
        <button
          type="button"
          className="hud-button"
          onClick={onPause}
          aria-label="Pause"
          disabled={phase !== 'playing'}
        >
          <Pause size={18} fill="currentColor" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hud-button hud-restart"
          onClick={onRestart}
          aria-label="Restart"
        >
          <RotateCcw size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
