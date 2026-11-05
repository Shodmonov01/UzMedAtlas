import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/shared/i18n/lang";

export type SelectOption = { value: string; label: string };

type Props = {
  name?: string;
  value: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  /** Shown as the heading of the phone sheet (the field's own label, e.g. "City"). */
  title?: string;
  onChange: (value: string) => void;
};

const PHONE = "(max-width: 639px)";

/** A select in the site's style. On wider screens the options open as a white card under the field; on phones they
 *  open as a sheet from the bottom of the screen (big rows, easy to reach with a thumb) over a dimmed page that does
 *  not scroll meanwhile. The picked option carries a check mark. Esc, a click outside or a pick closes it; on wider
 *  screens scrolling the page closes it too. */
export function SelectField({
  name,
  value,
  options,
  placeholder,
  className = "",
  title,
  onChange,
}: Props) {
  const id = useId();
  const { t } = useLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const selected = options.find((o) => o.value === value);
  const label = selected?.label || placeholder || t({ ru: "Выбрать", uz: "Tanlash", en: "Choose" });

  useEffect(() => {
    if (!open) return;
    const phone = sheet;
    const onDoc = (e: MouseEvent) => {
      // The phone sheet lives in <body> (see below), so a tap inside it counts as inside too.
      const target = e.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !sheetRef.current?.contains(target)
      )
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // Scrolling the page closes the card (scrolling inside the list itself does not reach the window).
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    const root = document.documentElement;
    if (phone) root.style.overflow = "hidden";
    else window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      if (phone) root.style.removeProperty("overflow");
    };
  }, [open, sheet]);

  const list = (
    <ul role="listbox" aria-labelledby={id} className="select-options">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <li key={option.value || "__empty"}>
            <button
              type="button"
              role="option"
              aria-selected={active}
              className={active ? "is-active" : undefined}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              <svg
                className="select-check"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m5 12.5 4.5 4.5L19 7.5"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      ref={rootRef}
      className={`select-field relative ${open ? "is-open" : ""} ${className}`}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`field flex w-full items-center justify-between gap-2 text-left ${selected ? "text-ink" : "text-muted"}`}
        onClick={() => {
          // Decided at the tap, so the phone sheet never flashes as a card first.
          setSheet(window.matchMedia(PHONE).matches);
          setOpen((v) => !v);
        }}
      >
        <span className="truncate">{label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && !sheet ? <div className="select-card">{list}</div> : null}

      {/* The phone sheet is drawn in <body>: a transformed ancestor (an entrance animation) would otherwise pin its
          fixed position to that ancestor instead of the screen. */}
      {open && sheet
        ? createPortal(
            <>
              <div
                className="select-backdrop"
                aria-hidden="true"
                onClick={() => setOpen(false)}
              />
              <div
                ref={sheetRef}
                className="select-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-title`}
              >
                <span className="select-sheet-handle" aria-hidden="true" />
                <div className="select-sheet-head">
                  <p id={`${id}-title`}>{title || label}</p>
                  <button
                    type="button"
                    className="select-sheet-close"
                    aria-label={t({ ru: "Закрыть", uz: "Yopish", en: "Close" })}
                    onClick={() => setOpen(false)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="m6 6 12 12M18 6 6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                {list}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
