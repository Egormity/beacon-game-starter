import { useEffect, useState } from 'react';
import { ArrowUpRight, Leaf, RadioTower, Waves } from 'lucide-react';
import { levels } from '../game/levels';
import { useGame } from './useGame';
import { readPreferences, savePreferences } from './preferences';
import { HelpDialog } from './HelpDialog';
import { MissionPanel } from './MissionPanel';
import { GameStage } from './GameStage';

export const App = () => {
  const [levelId, setLevelId] = useState(levels[0].id);
  const level = levels.find((entry) => entry.id === levelId)!;
  const [preferences, setPreferences] = useState(readPreferences);
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [help, setHelp] = useState(false);
  const controller = useGame(level, {
    ...preferences,
    reducedMotion: systemReduced || preferences.reducedMotion,
  });

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setSystemReduced(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);
  useEffect(() => {
    document.documentElement.dataset.motion =
      systemReduced || preferences.reducedMotion ? 'reduced' : 'full';
  }, [preferences.reducedMotion, systemReduced]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#main" aria-label="Beacon game">
          <span className="brand-icon">
            <RadioTower size={25} strokeWidth={1.6} />
          </span>
          BEACON<span className="brand-period">●</span>
        </a>
        <span className="header-edition">
          ISLAND RELAY <i /> A LITTLE WORLD TO GET LOST IN
        </span>
        <a
          className="source-link"
          href="https://github.com/Egormity/beacon-game-starter"
          target="_blank"
          rel="noreferrer"
        >
          Explore the source
          <ArrowUpRight size={16} />
        </a>
      </header>
      <main id="main" className="main-layout">
        <MissionPanel
          levels={levels}
          level={level}
          collected={controller.snapshot?.collectedIds.length ?? 0}
          phase={controller.snapshot?.phase}
          best={controller.best}
          onLevelChange={setLevelId}
          onHelp={() => {
            controller.game.current?.pause();
            setHelp(true);
          }}
        />
        <GameStage level={level} controller={controller}>
          <div className="game-caption">
            <p>
              <span>TAKE THE SCENIC ROUTE.</span> The signal can wait a moment.
            </p>
            <div className="display-settings">
              <button
                aria-pressed={preferences.lowQuality}
                onClick={() =>
                  setPreferences((value) => ({ ...value, lowQuality: !value.lowQuality }))
                }
              >
                <Leaf size={14} />
                Light graphics
              </button>
              <button
                aria-pressed={systemReduced || preferences.reducedMotion}
                disabled={systemReduced}
                onClick={() =>
                  setPreferences((value) => ({ ...value, reducedMotion: !value.reducedMotion }))
                }
              >
                <Waves size={14} />
                Less motion
              </button>
            </div>
          </div>
        </GameStage>
      </main>
      <footer className="site-footer">
        <span>FIND YOUR SPARK.</span>
        <span>
          A tiny adventure, made to be yours.<span className="footer-star">✳</span>
        </span>
      </footer>
      {help && <HelpDialog onClose={() => setHelp(false)} />}
    </div>
  );
};
