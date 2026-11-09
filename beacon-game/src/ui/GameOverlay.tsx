import { Play, RotateCcw } from 'lucide-react';
import type { GamePhase } from '../game/types';
import { formatTime } from './preferences';

interface Props {
  phase: GamePhase | undefined;
  error: string | null;
  elapsed: number;
  best: number | null;
  play: () => void;
  resume: () => void;
  restart: () => void;
  retry: () => void;
}

export const GameOverlay = ({
  phase,
  error,
  elapsed,
  best,
  play,
  resume,
  restart,
  retry,
}: Props) => {
  if (!error && phase === 'playing') return null;

  const cardClass = [
    'overlay-card',
    !error && !phase ? 'is-loading' : '',
    phase === 'paused' ? 'is-compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="game-overlay">
      <div className={cardClass}>
        {error ? (
          <>
            <h2>The island didn’t load.</h2>
            <p className="overlay-lead">{error}</p>
            <p className="overlay-note">
              This game needs WebGL 2. Try a current browser with hardware acceleration turned on.
            </p>
            <button type="button" className="primary-button" onClick={retry}>
              <RotateCcw size={18} aria-hidden="true" />
              Reload the island
            </button>
          </>
        ) : !phase ? (
          <div className="overlay-loading" role="status">
            <span className="spinner" aria-hidden="true" />
            <p>Loading the island…</p>
          </div>
        ) : phase === 'ready' ? (
          <>
            <h2>Light up the island.</h2>
            <p className="overlay-lead">Collect the energy cells, then return to the beacon.</p>
            <button type="button" className="primary-button" onClick={play}>
              <Play size={19} fill="currentColor" aria-hidden="true" />
              Play
            </button>
            <div className="control-hints" aria-hidden="true">
              <span>
                <kbd>WASD</kbd> Move
              </span>
              <span>
                <kbd>Space</kbd> Jump
              </span>
            </div>
            <p className="touch-hint">Drag to move · Tap Jump to leap</p>
          </>
        ) : phase === 'paused' ? (
          <>
            <h2>Paused</h2>
            <button type="button" className="primary-button" onClick={resume}>
              Continue
            </button>
            <button type="button" className="secondary-button" onClick={restart}>
              Restart island
            </button>
          </>
        ) : (
          <>
            <h2>Signal restored.</h2>
            <p className="overlay-lead">The beacon is glowing again.</p>
            <div className="overlay-stats">
              <div className="overlay-stat">
                <span>Time</span>
                <strong>{formatTime(elapsed)}</strong>
              </div>
              <div className="overlay-stat">
                <span>Best</span>
                <strong>{formatTime(best ?? elapsed)}</strong>
              </div>
            </div>
            <button type="button" className="primary-button" onClick={restart}>
              <RotateCcw size={18} aria-hidden="true" />
              Play again
            </button>
          </>
        )}
      </div>
    </div>
  );
};
