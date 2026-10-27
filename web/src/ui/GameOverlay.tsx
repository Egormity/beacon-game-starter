import { ArrowRight, Play, RadioTower, RotateCcw } from 'lucide-react';
import type { GamePhase } from '../game/types';
import { formatTime } from './preferences';

interface Props {
  phase: GamePhase | undefined;
  error: string | null;
  elapsed: number;
  falls: number;
  play: () => void;
  resume: () => void;
  restart: () => void;
  retry: () => void;
}
export const GameOverlay = ({
  phase,
  error,
  elapsed,
  falls,
  play,
  resume,
  restart,
  retry,
}: Props) => {
  if (!error && phase === 'playing') return null;
  return (
    <div className="game-overlay">
      <div className="overlay-card">
        <span className="overlay-symbol">
          <RadioTower size={27} strokeWidth={1.4} />
        </span>
        {error ? (
          <>
            <p className="eyebrow">THE SIGNAL GOT LOST</p>
            <h2>Let’s try that again.</h2>
            <p>{error}</p>
            <p className="error-hint">
              This game needs WebGL 2. Try an up-to-date browser with hardware acceleration enabled.
            </p>
            <button className="primary-button" onClick={retry}>
              <RotateCcw size={17} />
              Reload the island
            </button>
          </>
        ) : !phase ? (
          <>
            <p className="eyebrow">PREPARING YOUR ISLAND</p>
            <h2>A moment of calm.</h2>
            <p role="status">Loading the world…</p>
          </>
        ) : phase === 'ready' ? (
          <>
            <p className="eyebrow">A SMALL ADVENTURE</p>
            <h2>The signal is waiting.</h2>
            <p>
              Gather the energy cells.
              <br />
              Find your way back to the light.
            </p>
            <button className="primary-button" onClick={play}>
              <Play size={16} fill="currentColor" />
              Play Island Relay
              <ArrowRight size={17} />
            </button>
            <small>WASD to move · Space to jump</small>
          </>
        ) : phase === 'paused' ? (
          <>
            <p className="eyebrow">TAKE YOUR TIME</p>
            <h2>A little breather.</h2>
            <p>Your island will be right here.</p>
            <button className="primary-button" onClick={resume}>
              <Play size={16} />
              Continue exploring
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow">SIGNAL RESTORED</p>
            <h2>You brought the light.</h2>
            <p>
              The island is back online.
              <br />
              {formatTime(elapsed)} ·{' '}
              {falls === 0
                ? 'A clean run'
                : `${falls} ${falls === 1 ? 'return' : 'returns'} to shore`}
            </p>
            <button className="primary-button" onClick={restart}>
              <RotateCcw size={17} />
              Take another run
            </button>
          </>
        )}
      </div>
    </div>
  );
};
