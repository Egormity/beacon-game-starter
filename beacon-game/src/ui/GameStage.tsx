import type { LevelDefinition } from '../game/types';
import type { useGame } from './useGame';
import { GameOverlay } from './GameOverlay';
import { GameHud } from './GameHud';
import { TouchControls } from './TouchControls';

interface Props {
  level: LevelDefinition;
  controller: ReturnType<typeof useGame>;
}

export const GameStage = ({ level, controller }: Props) => {
  const { canvas, canvasKey, game, snapshot, error, play, resume, restart, retry, best } =
    controller;
  const collected = snapshot?.collectedIds.length ?? 0;
  const phase = snapshot?.phase;
  const ready = phase === 'playing';
  const hudVisible = !error && (phase === 'playing' || phase === 'paused' || phase === 'won');

  return (
    <main
      id="stage"
      className="game-frame"
      data-phase={phase ?? 'loading'}
      aria-label="Island Relay game"
    >
      <canvas
        key={`${level.id}-${canvasKey}`}
        ref={canvas}
        className="game-canvas"
        tabIndex={0}
        aria-label="Island game. Move with WASD or arrow keys, jump with Space, pause with Escape."
      />
      <div className="stage-vignette" aria-hidden="true" />
      {hudVisible && (
        <GameHud
          level={level}
          collected={collected}
          phase={phase}
          elapsed={snapshot?.elapsed ?? 0}
          onPause={() => game.current?.pause()}
          onRestart={restart}
        />
      )}
      <GameOverlay
        phase={phase}
        error={error}
        elapsed={snapshot?.elapsed ?? 0}
        best={best}
        play={play}
        resume={resume}
        restart={restart}
        retry={retry}
      />
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
    </main>
  );
};
