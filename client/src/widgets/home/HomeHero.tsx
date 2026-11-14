import { useRef, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ChatCircleDots, SealCheck, Stethoscope, Tag } from "@phosphor-icons/react";
import { EASE_OUT, MOTION_OK, ScrollTrigger, SplitText, glideTo, gsap, useGSAP } from "@/shared/lib/gsap";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";

const POINTS = [
  { icon: SealCheck, text: "Vetted private clinics" },
  { icon: Tag, text: "Clear prices before you travel" },
  { icon: ChatCircleDots, text: "A reply within 24 hours" },
];

/** The home page opens on a surgeon in the operating room over the whole screen: the surgeon on the
 *  right, the copy on the open blue to the left. Upright screens get the MEDGUIDE UZ cover portrait instead, with the
 *  copy below the face. Both photos come in several widths, picked by the size they are shown at, so they stay sharp;
 *  on arrival the photo settles in,
 *  then the label, the headline (line by line), the line and the buttons rise in. The photo stays hidden until it is
 *  decoded, so it never paints half loaded. With reduced motion everything is simply in place. */
export function HomeHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const hero = root.current;
      if (hero === null) return;
      const photo = hero.querySelector<HTMLImageElement>(".home-hero-photo");
      const ready = photo ? photo.decode().catch(() => undefined) : Promise.resolve();
      // The intro starts at one quiet moment: the photo decoded, the webfont in, and the page's first heavy render
      // over (an idle callback, then a frame). Started earlier, its first frames would stutter.
      const settled = Promise.all([ready, document.fonts.ready]).then(
        () =>
          new Promise<void>((resolve) => {
            const next = () => requestAnimationFrame(() => resolve());
            if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(next, { timeout: 700 });
            else setTimeout(next, 60);
          }),
      );
      let alive = true;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const intro = gsap
          .timeline({ paused: true, defaults: { ease: EASE_OUT } })
          .to(photo, { autoAlpha: 1, duration: 1, ease: "power1.out" }, 0)
          .from(photo, { scale: 1.08, duration: 2.4, force3D: true, clearProps: "transform" }, 0)
          .from(".home-hero-eyebrow", { y: 16, autoAlpha: 0, duration: 1 }, 0.35)
          .from([".home-hero-lead", ".home-hero-actions > *", ".home-hero-points"], { y: 24, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, 0.8);

        void settled.then(() => {
          if (!alive) return;
          intro.play();
          // The headline is split only now, with the webfont in, so it never splits twice; it stays hidden until then.
          SplitText.create(".home-hero-title", {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              self.elements.forEach((el) => el.classList.remove("is-split-pending"));
              return gsap.from(self.lines, { yPercent: 110, duration: 1.4, stagger: 0.12, ease: EASE_OUT, delay: 0.45 });
            },
          });
        });

        // Scrolling away, the photo drifts a little slower than the page.
        gsap.to(photo, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.4 },
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        void ready.then(() => {
          if (alive) gsap.set(photo, { autoAlpha: 1 });
        });
      });

      // This trigger only tells the header how long it sits over the photo
      // (until the hero's bottom edge is 80px from the top of the screen).
      ScrollTrigger.create({ id: "home-hero", trigger: hero, start: "top top", end: "bottom top+=80" });

      return () => {
        alive = false;
      };
    },
    { scope: root },
  );

  function toCatalog(event: MouseEvent<HTMLAnchorElement>) {
    if (glideTo("catalog")) event.preventDefault();
  }

  return (
    <section ref={root} className="home-hero" aria-labelledby="home-hero-title">
      <picture>
        {/* Upright screens: the cover portrait, taller and sharper for that shape (shown in the top 74% of the
            hero, so about 0.88 x 74% of the screen height wide). */}
        <source
          media="(orientation: portrait)"
          srcSet="/images/hero/hero-mobile-1100.webp 1100w, /images/hero/hero-mobile.webp 1762w"
          sizes="66svh"
        />
        {/* Wide screens: the operating-room shot. It covers the screen, so on screens narrower than 16:9 it is as
            wide as the screen is tall times 1.777. */}
        <img
          className="home-hero-photo"
          src="/images/hero/hero-desktop.webp"
          srcSet="/images/hero/hero-desktop-1000.webp 1000w, /images/hero/hero-desktop.webp 1672w, /images/hero/hero-desktop-2400.webp 2400w"
          sizes="(max-aspect-ratio: 1672/941) 178svh, 100vw"
          alt="A surgeon in a cap, mask and magnifying loupes looks at a tiny implant in his gloved hand"
          width={1672}
          height={941}
          fetchPriority="high"
          draggable={false}
        />
      </picture>
      <span className="home-hero-shade" />

      <div className="home-hero-stage">
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow">
            <img src="/brand/logo.svg?v=2" alt="" width={24} height={24} />
            MEDGUIDE UZ
          </p>
          <h1 id="home-hero-title" className="home-hero-title is-split-pending">
            Medicine you can <em>trust</em>
          </h1>
          <p className="home-hero-lead">
            One catalog of vetted private clinics across Uzbekistan. Compare doctors, prices and equipment, then send a
            request in a few clicks.
          </p>
          <div className="home-hero-actions">
            <a href="#catalog" className="pill-btn is-brand" onClick={toCatalog}>
              Find a clinic
              <span className="pill-btn-icon">
                <ArrowIcon />
              </span>
            </a>
            <Link to="/checker" className="pill-btn is-outline-light">
              <Stethoscope size={18} weight="bold" aria-hidden="true" />
              Find a specialty
            </Link>
          </div>
        </div>

        {/* Three short promises on a white bar along the bottom of the hero. */}
        <ul className="home-hero-points">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <i aria-hidden="true">
                <Icon size={16} weight="bold" />
              </i>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
