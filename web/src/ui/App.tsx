import { useEffect, useRef, useState } from 'react';
import { CircleHelp, RadioTower } from 'lucide-react';
import { levels } from '../game/levels';
import { useGame } from './useGame';
import { readPreferences, savePreferences } from './preferences';
import { HelpDialog } from './HelpDialog';
import { GameStage } from './GameStage';
import { IslandMenu } from './IslandMenu';

export const App = () => {
  const [levelId, setLevelId] = useState(levels[0].id);
  const level = levels.find((entry) => entry.id === levelId)!;
  const [preferences, setPreferences] = useState(readPreferences);
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [help, setHelp] = useState(false);
  const resumeAfterHelp = useRef(false);
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

  const openHelp = () => {
    resumeAfterHelp.current = controller.snapshot?.phase === 'playing';
    controller.game.current?.pause();
    setHelp(true);
  };

  const closeHelp = () => {
    setHelp(false);
    if (resumeAfterHelp.current) {
      resumeAfterHelp.current = false;
      controller.resume();
    }
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <a className="brand" href="#stage" aria-label="Beacon">
          <span className="brand-mark" aria-hidden="true">
            <RadioTower size={19} strokeWidth={1.9} />
          </span>
          <span className="brand-word">Beacon</span>
        </a>
        <div className="top-actions">
          <IslandMenu levels={levels} level={level} onChange={setLevelId} />
          <button type="button" className="help-trigger" onClick={openHelp} aria-label="Help">
            <CircleHelp size={18} aria-hidden="true" />
            <span>Help</span>
          </button>
        </div>
      </header>
      <GameStage level={level} controller={controller} />
      {help && (
        <HelpDialog
          preferences={preferences}
          systemReduced={systemReduced}
          onChange={setPreferences}
          onClose={closeHelp}
        />
      )}
    </div>
  );
};
