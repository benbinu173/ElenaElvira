import './chrome.css';

/** Sound is never autoplayed, only ever triggered by a tap. This is the switch. */
export default function SoundToggle({ on, onToggle }) {
  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
    >
      <span className="sound-toggle__bars" aria-hidden="true">
        <i style={{ height: on ? '10px' : '3px' }} />
        <i style={{ height: on ? '14px' : '3px' }} />
        <i style={{ height: on ? '7px' : '3px' }} />
      </span>
      {on ? 'Sound on' : 'Sound off'}
    </button>
  );
}
