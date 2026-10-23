import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// Sections of the home page, in page order.
const SECTIONS = [
  { id: "country", label: "Наша страна" },
  { id: "tourism", label: "Туризм" },
  { id: "film", label: "Фильм" },
  { id: "medtourism", label: "Медтуризм" },
  { id: "catalog", label: "Клиники" },
];

export function Header() {
  // On the home page the header is see-through over the hero film and turns white once the film is scrolled past.
  // It slides away while scrolling down and comes back on the first scroll up.
  const [scrolled, setScrolled] = useState(false);
  const [overFilm, setOverFilm] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // The section the reader is in, highlighted in the nav.
  const [active, setActive] = useState("");

  useEffect(() => {
    let lastY = window.scrollY;
    const update = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // The hero stays pinned for one screen while the next section rises over it.
      setOverFilm(y < window.innerHeight - 80);
      if (y < 120) setHidden(false);
      else if (Math.abs(y - lastY) > 4) setHidden(y > lastY);
      lastY = y;
      // The last section whose top has passed the upper third of the screen.
      let current = "";
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight / 3) current = id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const startY = window.scrollY;
    const close = () => setMenuOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 40) close();
    };
    const wide = window.matchMedia("(min-width: 1024px)");
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    wide.addEventListener("change", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      wide.removeEventListener("change", close);
    };
  }, [menuOpen]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}${overFilm ? " is-over-film" : ""}${hidden && !menuOpen ? " is-hidden" : ""}${menuOpen ? " is-open" : ""}`}>
      <div className="site-header-bar">
        <Link
          to="/"
          className="site-brand"
          // Always back to the very top of the home page, also when already on it.
          resetScroll
          onClick={() => {
            setMenuOpen(false);
            // The page's smooth scroll-behavior would turn the router's own jump into a long glide that stops short.
            const root = document.documentElement;
            root.style.scrollBehavior = "auto";
            window.scrollTo({ top: 0, behavior: "instant" });
            window.setTimeout(() => root.style.removeProperty("scroll-behavior"), 300);
          }}
        >
          <span className="site-logo-tile">
            <img src="/brand/logo.svg" alt="" width={32} height={32} className="site-logo-mark" />
          </span>
          <span className="site-brand-text">
            <strong>Ассоциация</strong>
            <span>медицинских организаций</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Разделы">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`/#${section.id}`} className={active === section.id ? "is-active" : undefined}>
              {section.label}
            </a>
          ))}
        </nav>
        <div className="site-header-end">
          <Link to="/cabinet/login" className="site-header-action">
            Для клиник
            <span className="site-header-action-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
          <button
            type="button"
            className="site-menu-button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className="site-menu-backdrop" hidden={!menuOpen} onClick={() => setMenuOpen(false)} />
      <nav id="site-menu" className="site-menu" aria-label="Разделы" hidden={!menuOpen}>
        {SECTIONS.map((section, i) => (
          <a
            key={section.id}
            href={`/#${section.id}`}
            className={active === section.id ? "is-active" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            <span className="site-menu-index">{String(i + 1).padStart(2, "0")}</span>
            {section.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ))}
        <Link to="/cabinet/login" className="site-menu-action" onClick={() => setMenuOpen(false)}>
          Для клиник
          <span aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
      </nav>
    </header>
  );
}
