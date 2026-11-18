import { Link, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { AirplaneTilt, Buildings, CaretRight, UsersThree, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { ScrollTrigger, glideTo, gsap, useGSAP } from "@/shared/lib/gsap";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";

// Sections of the home page, in page order, linked from the nav.
const SECTIONS: { id: string; label: string; icon: PhosphorIcon }[] = [
  { id: "medtourism", label: "Medical travel", icon: AirplaneTilt },
  { id: "catalog", label: "Clinics", icon: Buildings },
  { id: "team", label: "Team", icon: UsersThree },
];
const FIND_CLINIC: string = "Find a clinic";
const BRAND: { title: string; sub: string } = {
  title: "Association",
  sub: "of Medical Organizations",
};

/** On the home page a section link glides to its section and leaves the URL (and the catalog filters in it) alone.
 *  Elsewhere the click goes through and the router opens the home page at that section. */
function goToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (glideTo(id)) event.preventDefault();
}

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // A solid white bar at the top. On the home page it is see-through over the hero only while the page is at its very
  // top; as soon as the reader scrolls it is white. It slides away while the reader scrolls down and comes back as soon
  // as they scroll up.
  const [scrolled, setScrolled] = useState(false);
  const [overFilm, setOverFilm] = useState(pathname === "/");
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
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

  useEffect(() => placePill(true), [active, pathname, placePill]);

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
        setOverFilm(pathname === "/" && y <= 24);
        // Near the top the bar is always shown; further down it hides on the way down and returns on the way up
        // (small jitters of a few pixels are ignored).
        const delta = y - lastY.current;
        if (y < 120) setHidden(false);
        else if (delta > 4) setHidden(true);
        else if (delta < -4) setHidden(false);
        if (y < 120 || Math.abs(delta) > 4) lastY.current = y;
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

  // Sticky bars under the header (the clinic page's section bar) move up into its place while it is away.
  const away = hidden && !menuOpen;
  useEffect(() => {
    document.documentElement.classList.toggle("is-header-hidden", away);
    return () => document.documentElement.classList.remove("is-header-hidden");
  }, [away]);

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
    <header className={`site-header${scrolled ? " is-scrolled" : ""}${overFilm ? " is-over-film" : ""}${away ? " is-hidden" : ""}${menuOpen ? " is-open" : ""}`}>
      <div className="site-header-bar">
        <Link
          to="/"
          className="site-brand"
          // Always back to the very top of the home page: from another page it opens at the top, and on the home page
          // itself the page glides up smoothly instead of jumping.
          resetScroll
          onClick={(event) => {
            setMenuOpen(false);
            if (pathname === "/" && glideTo(0)) event.preventDefault();
          }}
        >
          <img src="/brand/logo.svg?v=2" alt="" width={40} height={40} className="site-logo-mark" />
          <span className="site-brand-text">
            <strong>{BRAND.title}</strong>
            <span>{BRAND.sub}</span>
          </span>
        </Link>
        <nav ref={navRef} className="site-nav" aria-label="Sections">
          <span ref={indicatorRef} className="site-nav-indicator" aria-hidden="true" />
          {SECTIONS.map((section) => (
            <Link
              key={section.id}
              to="/"
              hash={section.id}
              className={active === section.id ? "is-active" : undefined}
              onClick={(event) => goToSection(event, section.id)}
            >
              {section.label}
            </Link>
          ))}
        </nav>
        <div className="site-header-end">
          {/* The main action opens the clinic catalog; the sign-in for clinics lives in the footer. */}
          <Link to="/" hash="catalog" className="site-header-action" onClick={(event) => goToSection(event, "catalog")}>
            {FIND_CLINIC}
            <span className="site-header-action-icon">
              <ArrowIcon />
            </span>
          </Link>
          <button
            type="button"
            className="site-menu-button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className="site-menu-backdrop" hidden={!menuOpen} onClick={() => setMenuOpen(false)} />
      {/* Phones and tablets: a sheet under the bar with the sections as one grouped list (an icon tile, the name, a
          chevron), then the button to the clinic catalog. */}
      <nav id="site-menu" className="site-menu" aria-label="Sections" hidden={!menuOpen}>
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
                <span>{section.label}</span>
                <CaretRight className="site-menu-chevron" size={18} weight="bold" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
        <Link
          to="/"
          hash="catalog"
          className="site-menu-action"
          onClick={(event) => {
            setMenuOpen(false);
            goToSection(event, "catalog");
          }}
        >
          {FIND_CLINIC}
          <span>
            <ArrowIcon />
          </span>
        </Link>
      </nav>
    </header>
  );
}
