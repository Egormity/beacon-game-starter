import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const HelpDialog = ({ onClose }: { onClose: () => void }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="help-dialog"
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="help-title"
    >
      <button
        type="button"
        className="icon-button close-help"
        onClick={onClose}
        aria-label="Close controls"
      >
        <X size={20} />
      </button>
      <p className="eyebrow">YOUR FIELD GUIDE</p>
      <h2 id="help-title">A little direction.</h2>
      <p>
        Collect every floating energy cell, then walk into the beacon’s ring. Jump onto the raised
        platforms. If you fall, you return to the start with your cells.
      </p>
      <dl>
        <div>
          <dt>Move</dt>
          <dd>W A S D / arrow keys</dd>
        </div>
        <div>
          <dt>Jump</dt>
          <dd>Space</dd>
        </div>
        <div>
          <dt>Sprint</dt>
          <dd>Hold Shift</dd>
        </div>
        <div>
          <dt>Pause</dt>
          <dd>Escape</dd>
        </div>
        <div>
          <dt>Restart</dt>
          <dd>R</dd>
        </div>
      </dl>
      <p className="help-note">
        On touchscreens, drag the movement pad and tap Jump. The game pauses when you leave the tab.
        Your best time is saved on this device.
      </p>
      <button className="primary-button" type="button" onClick={onClose}>
        Got it
      </button>
    </dialog>
  );
};
