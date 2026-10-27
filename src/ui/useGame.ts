import { useEffect, useRef, useState } from 'react';
import type { GameSnapshot, LevelDefinition } from '../game/types';
import { createGame, type GameHandle } from '../engine/createGame';
import { readBest, saveBest, type Preferences } from './preferences';

export const useGame = (level: LevelDefinition, preferences: Preferences) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<GameHandle | null>(null);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [best, setBest] = useState<number | null>(() => readBest(level.id));

  useEffect(() => {
    const abort = new AbortController();
    let owned: GameHandle | null = null;
    setSnapshot(null);
    setError(null);
    setBest(readBest(level.id));
    void createGame(
      canvas.current!,
      (next) => {
        if (abort.signal.aborted) return;
        setSnapshot(next);
        if (next.phase === 'won') setBest(saveBest(level.id, next.elapsed));
      },
      {
        level,
        ...preferencesRef.current,
        signal: abort.signal,
        onError: (message) => {
          if (!abort.signal.aborted) setError(message);
        },
      },
    )
      .then((instance) => {
        if (abort.signal.aborted) {
          instance.dispose();
          return;
        }
        owned = instance;
        game.current = instance;
        instance.setQuality(preferencesRef.current.lowQuality);
        instance.setReducedMotion(preferencesRef.current.reducedMotion);
        setSnapshot(instance.snapshot());
      })
      .catch((reason: unknown) => {
        if (!abort.signal.aborted)
          setError(
            (current) =>
              current ??
              (reason instanceof Error ? reason.message : 'The island could not be loaded.'),
          );
      });
    return () => {
      abort.abort();
      owned?.dispose();
      game.current = null;
    };
  }, [level, retry]);

  useEffect(() => {
    game.current?.setQuality(preferences.lowQuality);
  }, [preferences.lowQuality]);
  useEffect(() => {
    game.current?.setReducedMotion(preferences.reducedMotion);
  }, [preferences.reducedMotion]);

  const play = () => {
    game.current?.start();
    canvas.current?.focus();
  };
  const resume = () => {
    game.current?.resume();
    canvas.current?.focus();
  };
  const restart = () => {
    game.current?.restart();
    canvas.current?.focus();
  };
  return {
    canvas,
    canvasKey: retry,
    game,
    snapshot,
    error,
    best,
    play,
    resume,
    restart,
    retry: () => setRetry((value) => value + 1),
  };
};
