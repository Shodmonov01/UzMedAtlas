import { Link, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { AirplaneTilt, Buildings, CaretRight, Stethoscope, UsersThree, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { ScrollTrigger, glideTo, gsap, useGSAP } from "@/shared/lib/gsap";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { LanguageSwitch } from "@/shared/ui/LanguageSwitch";
import { useLang, type Text } from "@/shared/i18n/lang";

// Sections of the home page, in page order, linked from the nav.
const SECTIONS: { id: string; label: Text; icon: PhosphorIcon }[] = [
  { id: "medtourism", label: { ru: "Медтуризм", uz: "Tibbiy turizm", en: "Medical travel" }, icon: AirplaneTilt },
  { id: "catalog", label: { ru: "Каталог клиник", uz: "Klinikalar", en: "Clinics" }, icon: Buildings },
  { id: "team", label: { ru: "Команда", uz: "Jamoa", en: "Team" }, icon: UsersThree },
];
const PICKER: Text = { ru: "Подбор направления", uz: "Yoʻnalish tanlash", en: "Find a specialty" };
const FOR_CLINICS: Text = { ru: "Для клиник", uz: "Klinikalar uchun", en: "For clinics" };
const BRAND: { title: Text; sub: Text } = {
  title: { ru: "Ассоциация", uz: "Assotsiatsiya", en: "Association" },
  sub: { ru: "медицинских организаций", uz: "tibbiyot tashkilotlari", en: "of Medical Organizations" },
};

/** On the home page a section link glides to its section and leaves the URL (and the catalog filters in it) alone.
 *  Elsewhere the click goes through and the router opens the home page at that section. */
function goToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (glideTo(id)) event.preventDefault();
}

export function Header() {
  const { lang, t } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // A solid bar glued to the top and always in view; on the home page it is see-through over the hero film
  // and turns white once the film draws back.
  const [scrolled, setScrolled] = useState(false);
  const [overFilm, setOverFilm] = useState(pathname === "/");
  const [menuOpen, setMenuOpen] = useState(false);
  // The section the reader is in, highlighted in the nav.
  const [active, setActive] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // The current link sits on a soft pill that glides to the next current link (instantly with reduced motion,
  // and in place the first time it appears); with no current link the pill fades out.
  const placePill = useCallback((animate: boolean) => {
    const nav = navRef.current;
    const pill = indicatorRef.current;
    if (!nav || !pill) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const link = nav.querySelector<HTMLElement>("a.is-active");
    if (!link) {
      gsap.to(pill, { autoAlpha: 0, duration: still ? 0 : 0.3, overwrite: true });
      return;
    }
    const target = { x: link.offsetLeft, width: link.offsetWidth, autoAlpha: 1 };
    const shown = Number(gsap.getProperty(pill, "opacity")) > 0.05;
    if (!animate || still || !shown) gsap.set(pill, { ...target, overwrite: true });
    else gsap.to(pill, { ...target, duration: 0.6, ease: "expo.out", overwrite: true });
  }, []);

  useEffect(() => placePill(true), [active, pathname, lang, placePill]);

  useEffect(() => {
    const pill = indicatorRef.current;
    const onResize = () => placePill(false);
    window.addEventListener("resize", onResize);
    void document.fonts?.ready.then(() => placePill(false));
    return () => {
      window.removeEventListener("resize", onResize);
      if (pill) gsap.killTweensOf(pill);
    };
  }, [placePill]);

  useGSAP(
    () => {
      const update = (y: number) => {
        setScrolled(y > 24);
        // Over the film until the hero's trigger ends (its bottom edge just under the header). The hero sets up its
        // trigger after the header does; until then the top of the home page counts as over the film.
        // Measured from the scroll position, not the trigger's own progress, which may not have caught up with a jump yet.
        const hero = ScrollTrigger.getById("home-hero");
        setOverFilm(hero ? y < hero.end : pathname === "/" && y < 40);
        // The last section whose top has passed the upper third of the screen.
        let current = "";
        for (const { id } of SECTIONS) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top < window.innerHeight / 3) current = id;
        }
        setActive(current);
      };
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => update(self.scroll()),
        onRefresh: (self) => update(self.scroll()),
      });
      update(window.scrollY);
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

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
    const wide = window.matchMedia("(min-width: 1180px)");
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
    <header className={`site-header${scrolled ? " is-scrolled" : ""}${overFilm ? " is-over-film" : ""}${menuOpen ? " is-open" : ""}`}>
      <div className="site-header-bar">
        <Link
          to="/"
          className="site-brand"
          // Always back to the very top of the home page, also when already on it.
          resetScroll
          onClick={() => {
            setMenuOpen(false);
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        >
          <img src="/brand/logo.svg" alt="" width={40} height={40} className="site-logo-mark" />
          <span className="site-brand-text">
            <strong>{t(BRAND.title)}</strong>
            <span>{t(BRAND.sub)}</span>
          </span>
        </Link>
        <nav ref={navRef} className="site-nav" aria-label={t({ ru: "Разделы", uz: "Boʻlimlar", en: "Sections" })}>
          <span ref={indicatorRef} className="site-nav-indicator" aria-hidden="true" />
          {SECTIONS.map((section) => (
            <Link
              key={section.id}
              to="/"
              hash={section.id}
              className={active === section.id ? "is-active" : undefined}
              onClick={(event) => goToSection(event, section.id)}
            >
              {t(section.label)}
            </Link>
          ))}
          <Link to="/checker" activeProps={{ className: "is-active" }}>
            {t(PICKER)}
          </Link>
        </nav>
        <div className="site-header-end">
          <LanguageSwitch className="site-header-lang" />
          <Link to="/cabinet/login" className="site-header-action">
            {t(FOR_CLINICS)}
            <span className="site-header-action-icon">
              <ArrowIcon />
            </span>
          </Link>
          <button
            type="button"
            className="site-menu-button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? t({ ru: "Закрыть меню", uz: "Menyuni yopish", en: "Close menu" }) : t({ ru: "Открыть меню", uz: "Menyuni ochish", en: "Open menu" })}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className="site-menu-backdrop" hidden={!menuOpen} onClick={() => setMenuOpen(false)} />
      {/* Phones and tablets: a sheet under the bar with the sections as one grouped list (an icon tile, the name, a
          chevron), then the clinics entrance. The language stays in the bar beside the menu button. */}
      <nav id="site-menu" className="site-menu" aria-label={t({ ru: "Разделы", uz: "Boʻlimlar", en: "Sections" })} hidden={!menuOpen}>
        <div className="site-menu-list">
          {SECTIONS.map((section, i) => {
            const Glyph = section.icon;
            return (
              <Link
                key={section.id}
                to="/"
                hash={section.id}
                className={active === section.id ? "is-active" : undefined}
                style={{ animationDelay: `${0.04 * i}s` }}
                onClick={(event) => {
                  setMenuOpen(false);
                  goToSection(event, section.id);
                }}
              >
                <i aria-hidden="true">
                  <Glyph size={22} weight="duotone" />
                </i>
                <span>{t(section.label)}</span>
                <CaretRight className="site-menu-chevron" size={18} weight="bold" aria-hidden="true" />
              </Link>
            );
          })}
          <Link to="/checker" activeProps={{ className: "is-active" }} style={{ animationDelay: `${0.04 * SECTIONS.length}s` }} onClick={() => setMenuOpen(false)}>
            <i aria-hidden="true">
              <Stethoscope size={22} weight="duotone" />
            </i>
            <span>{t(PICKER)}</span>
            <CaretRight className="site-menu-chevron" size={18} weight="bold" aria-hidden="true" />
          </Link>
        </div>
        <Link to="/cabinet/login" className="site-menu-action" onClick={() => setMenuOpen(false)}>
          {t(FOR_CLINICS)}
          <span>
            <ArrowIcon />
          </span>
        </Link>
      </nav>
    </header>
  );
}
