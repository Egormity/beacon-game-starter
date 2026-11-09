import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Preferences } from './preferences';

interface Props {
  preferences: Preferences;
  systemReduced: boolean;
  onChange: (next: Preferences) => void;
  onClose: () => void;
}

export const HelpDialog = ({ preferences, systemReduced, onChange, onClose }: Props) => {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      previous?.focus();
    };
  }, []);

  const toggle = (key: keyof Preferences) => onChange({ ...preferences, [key]: !preferences[key] });

  return (
    <dialog
      className="help-dialog"
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
      aria-labelledby="help-title"
    >
      <button type="button" className="dialog-close" onClick={onClose} aria-label="Close help">
        <X size={19} aria-hidden="true" />
      </button>
      <h2 id="help-title">How to play</h2>
      <p className="dialog-lead">
        Collect every energy cell, then step into the beacon ring. Falling takes you back to the
        start — you keep the cells you found.
      </p>
      <dl className="control-list">
        <div>
          <dt>Move</dt>
          <dd>
            <kbd>WASD</kbd>
            <span>or arrow keys</span>
          </dd>
        </div>
        <div>
          <dt>Jump</dt>
          <dd>
            <kbd>Space</kbd>
          </dd>
        </div>
        <div>
          <dt>Sprint</dt>
          <dd>
            <kbd>Shift</kbd>
          </dd>
        </div>
        <div>
          <dt>Pause / restart</dt>
          <dd>
            <kbd>Esc</kbd>
            <kbd>R</kbd>
          </dd>
        </div>
      </dl>
      <p className="dialog-note">On a touchscreen, drag the left pad to move and tap Jump.</p>
      <div className="settings">
        <p className="settings-title">Display</p>
        <button
          type="button"
          role="switch"
          className="switch-row"
          aria-checked={preferences.lowQuality}
          aria-label="Light graphics"
          onClick={() => toggle('lowQuality')}
        >
          <span className="switch-copy">
            <span className="switch-label">Light graphics</span>
            <small>Best for older phones and laptops.</small>
          </span>
          <span className="switch" aria-hidden="true" />
        </button>
        <button
          type="button"
          role="switch"
          className="switch-row"
          aria-checked={systemReduced || preferences.reducedMotion}
          aria-label="Reduce motion"
          disabled={systemReduced}
          onClick={() => toggle('reducedMotion')}
        >
          <span className="switch-copy">
            <span className="switch-label">Reduce motion</span>
            <small>
              {systemReduced ? 'Following your device setting.' : 'Calms the camera and effects.'}
            </small>
          </span>
          <span className="switch" aria-hidden="true" />
        </button>
      </div>
      <button type="button" className="primary-button" onClick={onClose}>
        Done
      </button>
    </dialog>
  );
};
