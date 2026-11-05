import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useLang, type Lang } from "@/shared/i18n/lang";

/** Round flags drawn on a 24 x 24 square that the button clips to a circle. */
const FLAGS: { value: Lang; name: string; flag: ReactNode }[] = [
  {
    value: "uz",
    name: "Oʻzbekcha",
    flag: (
      <>
        <rect width="24" height="8" fill="#0099b5" />
        <rect y="8" width="24" height="8" fill="#ffffff" />
        <rect y="16" width="24" height="8" fill="#1eb53a" />
        <rect y="7.6" width="24" height=".8" fill="#ce1126" />
        <rect y="15.6" width="24" height=".8" fill="#ce1126" />
        <circle cx="6.4" cy="4" r="2.6" fill="#ffffff" />
        <circle cx="7.4" cy="4" r="2.2" fill="#0099b5" />
        <g fill="#ffffff">
          <circle cx="10.6" cy="2.4" r=".5" />
          <circle cx="12.6" cy="2.4" r=".5" />
          <circle cx="14.6" cy="2.4" r=".5" />
          <circle cx="10.6" cy="4.2" r=".5" />
          <circle cx="12.6" cy="4.2" r=".5" />
          <circle cx="14.6" cy="4.2" r=".5" />
          <circle cx="10.6" cy="6" r=".5" />
          <circle cx="12.6" cy="6" r=".5" />
          <circle cx="14.6" cy="6" r=".5" />
        </g>
      </>
    ),
  },
  {
    value: "ru",
    name: "Русский",
    flag: (
      <>
        <rect width="24" height="8" fill="#ffffff" />
        <rect y="8" width="24" height="8" fill="#0039a6" />
        <rect y="16" width="24" height="8" fill="#d52b1e" />
      </>
    ),
  },
  {
    value: "en",
    name: "English",
    flag: (
      <>
        <rect width="24" height="24" fill="#012169" />
        <path d="M0 0 24 24M24 0 0 24" stroke="#ffffff" strokeWidth="4.8" />
        <path d="M0 0 24 24M24 0 0 24" stroke="#c8102e" strokeWidth="1.6" />
        <path d="M12 0v24M0 12h24" stroke="#ffffff" strokeWidth="7" />
        <path d="M12 0v24M0 12h24" stroke="#c8102e" strokeWidth="4" />
      </>
    ),
  },
];

/** The site language as a dropdown: the current language's round flag with a chevron opens a small white list of
 *  the three languages (flag and name). It closes on a pick, on Escape, on a click anywhere else and when the page
 *  scrolls. */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = FLAGS.find((item) => item.value === lang) ?? FLAGS[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // Scrolling the page closes the list too (a few pixels of drift are allowed, so a trackpad tremor does not).
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 8) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  return (
    <div ref={root} className={`lang-switch${open ? " is-open" : ""} ${className}`}>
      <button
        type="button"
        className="lang-switch-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t({ ru: "Язык сайта", uz: "Sayt tili", en: "Site language" })}: ${current.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="lang-flag">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {current.flag}
          </svg>
        </span>
        <svg className="lang-switch-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <ul id={listId} className="lang-switch-menu" hidden={!open}>
        {FLAGS.map((item) => (
          <li key={item.value}>
            <button
              type="button"
              lang={item.value}
              aria-pressed={lang === item.value}
              className={lang === item.value ? "is-active" : undefined}
              onClick={() => {
                setOpen(false);
                setLang(item.value);
              }}
            >
              <span className="lang-flag">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {item.flag}
                </svg>
              </span>
              {item.name}
              <svg className="lang-switch-check" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
