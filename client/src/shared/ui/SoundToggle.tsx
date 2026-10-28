type Props = { on: boolean; onToggle: () => void; className?: string };

/** Sound on/off for an ambient film: a speaker that shows waves when the sound is on and a cross when it is off. */
export function SoundToggle({ on, onToggle, className = "" }: Props) {
  return (
    <button
      type="button"
      className={`sound-toggle ${className}`}
      aria-pressed={on}
      aria-label={on ? "Выключить звук" : "Включить звук"}
      onClick={onToggle}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        {on ? (
          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        ) : (
          <path d="m16 9.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        )}
      </svg>
      <span>{on ? "Звук вкл." : "Звук"}</span>
    </button>
  );
}
