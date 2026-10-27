import { ArrowUpRight, Check, ChevronDown, CircleHelp, Diamond, Flag, Timer } from 'lucide-react';
import type { GamePhase, LevelDefinition } from '../game/types';
import { formatTime } from './preferences';

interface Props {
  levels: readonly LevelDefinition[];
  level: LevelDefinition;
  collected: number;
  phase: GamePhase | undefined;
  best: number | null;
  onLevelChange: (id: string) => void;
  onHelp: () => void;
}

export const MissionPanel = ({
  levels,
  level,
  collected,
  phase,
  best,
  onLevelChange,
  onHelp,
}: Props) => (
  <aside className="mission-panel" aria-label="Your mission">
    <div className="mission-heading">
      <p className="eyebrow">
        <span className="signal-dot" /> TRANSMISSION / 001
      </p>
      <h1>
        A small island.
        <br />
        <em>A little light.</em>
      </h1>
      <p className="mission-description">
        Somewhere out there, a beacon is waiting. Bring it back to life.
      </p>
    </div>
    <div className="island-picker">
      <label htmlFor="island">YOUR NEXT STOP</label>
      <div>
        <select
          id="island"
          value={level.id}
          onChange={(event) => onLevelChange(event.target.value)}
        >
          {levels.map((entry, index) => (
            <option value={entry.id} key={entry.id}>
              0{index + 1} — {entry.name}
            </option>
          ))}
        </select>
        <ChevronDown size={16} />
      </div>
      <p>{level.description}</p>
    </div>
    <div className="mission-checklist">
      <p className="eyebrow">THE PLAN IS SIMPLE</p>
      <div>
        <span className={collected === level.pickups.length ? 'task-icon done' : 'task-icon'}>
          {collected === level.pickups.length ? <Check size={16} /> : <Diamond size={16} />}
        </span>
        <p>
          Collect the energy cells<small>Follow the little floating lights.</small>
        </p>
      </div>
      <div>
        <span className={phase === 'won' ? 'task-icon done' : 'task-icon'}>
          {phase === 'won' ? <Check size={16} /> : <Flag size={16} />}
        </span>
        <p>
          Return to the beacon<small>Step into the ring to send the signal.</small>
        </p>
      </div>
    </div>
    <div className="personal-best">
      <Timer size={17} />
      <span>
        Your best run<strong>{best === null ? 'A fresh start' : formatTime(best)}</strong>
      </span>
      <span className="best-mark">↗</span>
    </div>
    <button type="button" className="help-button" onClick={onHelp}>
      <CircleHelp size={17} />A little help with the controls
      <ArrowUpRight size={15} />
    </button>
  </aside>
);
