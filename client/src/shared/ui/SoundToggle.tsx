import { useLang } from "@/shared/i18n/lang";

type Props = { on: boolean; onToggle: () => void; className?: string };

/** Sound on/off for an ambient film: a white pill with four equalizer bars that lie flat while the film is silent and
 *  rise and fall while its sound plays. The pill keeps its colour in both states; the bars and the label tell them apart. */
export function SoundToggle({ on, onToggle, className = "" }: Props) {
  const { t } = useLang();
  const label = on ? t({ ru: "Выключить звук", uz: "Ovozni oʻchirish", en: "Sound off" }) : t({ ru: "Включить звук", uz: "Ovozni yoqish", en: "Sound on" });
  return (
    <button
      type="button"
      className={`sound-toggle ${className}`}
      // The label names the action, so it is not also marked as a pressed toggle; on phones only the bars show.
      data-playing={on || undefined}
      aria-label={label}
      onClick={onToggle}
    >
      <span className="sound-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="sound-toggle-label">{label}</span>
    </button>
  );
}
