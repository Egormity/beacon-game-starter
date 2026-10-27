import type { ReactNode } from 'react';
import { Diamond, Pause, RotateCcw, Timer } from 'lucide-react';
import type { LevelDefinition } from '../game/types';
import type { useGame } from './useGame';
import { formatTime } from './preferences';
import { GameOverlay } from './GameOverlay';
import { TouchControls } from './TouchControls';

interface Props {
  level: LevelDefinition;
  controller: ReturnType<typeof useGame>;
  children: ReactNode;
}

export const GameStage = ({ level, controller, children }: Props) => {
  const { canvas, canvasKey, game, snapshot, error, play, resume, restart, retry } = controller;
  const collected = snapshot?.collectedIds.length ?? 0;
  const phase = snapshot?.phase;
  const ready = phase === 'playing';

  return (
    <section className="play-area" aria-label="Island Relay game">
      <div className="game-frame" data-phase={phase ?? 'loading'}>
        <canvas
          key={`${level.id}-${canvasKey}`}
          ref={canvas}
          className="game-canvas"
          tabIndex={0}
          aria-label="Island game. Move with WASD or arrow keys, jump with Space, pause with Escape."
        />
        <div className="game-hud">
          <div className="location-label">
            <span className="signal-dot" />
            <span>
              {level.name}
              <small>{phase === 'won' ? 'SIGNAL ONLINE' : 'AWAITING SIGNAL'}</small>
            </span>
          </div>
          <div className="run-stats">
            <span aria-label={`${collected} of ${level.pickups.length} energy cells`}>
              <Diamond size={15} fill="currentColor" />
              <b data-testid="collected">{collected}</b>
              <i>/ {level.pickups.length}</i>
            </span>
            <span className="timer">
              <Timer size={15} />
              <b>{formatTime(snapshot?.elapsed ?? 0)}</b>
            </span>
          </div>
        </div>
        <div className="world-coordinate" aria-hidden="true">
          N <span>↑</span>
        </div>
        <GameOverlay
          phase={phase}
          error={error}
          elapsed={snapshot?.elapsed ?? 0}
          falls={snapshot?.falls ?? 0}
          play={play}
          resume={resume}
          restart={restart}
          retry={retry}
        />
        {ready && (
          <div className="objective-cue" role="status">
            {collected === level.pickups.length
              ? 'All charged up. Head back to the beacon.'
              : 'A little exploring goes a long way.'}
          </div>
        )}
        <TouchControls
          disabled={!ready}
          move={(x, z) => game.current?.setMove(x, z)}
          jump={() => game.current?.jump()}
        />
        <span className="game-status sr-only" role="status">
          {phase === 'won'
            ? 'Signal restored. You won.'
            : `${collected} of ${level.pickups.length} energy cells collected.`}
        </span>
      </div>
      <div className="game-toolbar">
        <div className="keyboard-legend">
          <span>
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd> Move
          </span>
          <span>
            <kbd>SPACE</kbd> Jump
          </span>
          <span>
            <kbd>SHIFT</kbd> Sprint
          </span>
        </div>
        <div className="session-controls">
          <button
            className="icon-button"
            type="button"
            disabled={!ready}
            onClick={() => game.current?.pause()}
            aria-label="Pause game"
          >
            <Pause size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            disabled={!snapshot || !!error}
            onClick={restart}
            aria-label="Restart game"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>
      {children}
    </section>
  );
};
