import { useRef, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { EASE_OUT, MOTION_OK, ScrollTrigger, SplitText, glideTo, gsap, useGSAP } from "@/shared/lib/gsap";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";
import { useLang } from "@/shared/i18n/lang";

const WORD = "UZBEKISTAN";

/** The home page opens on Khiva at sunset over the whole screen, with UZBEKISTAN written across the sky behind the
 *  minarets: the photo is two layers (the sky, and the city cut out of it) with the word between them, and the copy
 *  centred at the bottom. On arrival the photo settles in and the letters rise one by one from behind the city; the
 *  word then stays still (the pointer does not move it) and only sinks back behind the roofs as the page scrolls.
 *  The photo and the word stay hidden until both layers are decoded, so the word never shows without the city in
 *  front of it. With reduced motion everything is simply in place. */
export function HomeHero() {
  const root = useRef<HTMLElement>(null);
  const { t } = useLang();

  useGSAP(
    () => {
      const hero = root.current;
      if (hero === null) return;
      const layers = Array.from(hero.querySelectorAll<HTMLImageElement>(".home-hero-layer"));
      const scene = [...layers, hero.querySelector(".home-hero-word")];
      const ready = Promise.all(layers.map((img) => img.decode().catch(() => undefined)));
      // The whole intro starts at one quiet moment: both photo layers decoded, the webfont in, and the page's first
      // heavy render over (an idle callback, then a frame). Started earlier, its first frames would land on that work
      // and stutter. Until then the copy and the scene simply wait hidden.
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
        const copy = gsap
          .timeline({ paused: true, defaults: { ease: EASE_OUT } })
          .from(".home-hero-eyebrow", { y: 16, autoAlpha: 0, duration: 1 }, 0.15)
          .from(".home-hero-actions > *", { y: 24, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, 0.6);

        // The photo fades in and settles while the letters come up from below the skyline, hidden by the city until
        // they clear the roofs. The two photo layers and the letters move on the GPU (force3D) for the whole intro,
        // and give the GPU back when it ends.
        const moving = [...layers, ...hero.querySelectorAll<HTMLElement>(".home-hero-letter")];
        const reveal = gsap
          .timeline({
            paused: true,
            defaults: { ease: EASE_OUT, force3D: true },
            onStart: () => gsap.set(moving, { willChange: "transform" }),
            onComplete: () => gsap.set(moving, { willChange: "auto" }),
          })
          .to(scene, { autoAlpha: 1, duration: 0.9, ease: "power1.out" }, 0)
          .from(layers, { scale: 1.08, duration: 2.4 }, 0)
          .from(".home-hero-letter", { y: () => hero.offsetHeight * 0.6, duration: 2, stagger: 0.05 }, 0.15);

        void settled.then(() => {
          if (!alive) return;
          reveal.play();
          copy.play();
          // The headline rises line by line. It is split only now, with the webfont in: split earlier, the font's
          // arrival would split it again and restart the rise halfway. It stays hidden until then, and is split again
          // only if the width changes its line breaks.
          SplitText.create(".home-hero-title", {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (self) => {
              self.elements.forEach((el) => el.classList.remove("is-split-pending"));
              return gsap.from(self.lines, { yPercent: 110, duration: 1.4, stagger: 0.12, ease: EASE_OUT, delay: 0.3 });
            },
          });
        });

        // Scrolling away, the word sinks back behind the city before it can reach the header (the photo itself keeps
        // its size and place).
        gsap.to(".home-hero-word", {
          y: () => hero.offsetHeight * 0.5,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "60% top", scrub: 0.4, invalidateOnRefresh: true },
        });
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        void ready.then(() => {
          if (alive) gsap.set(scene, { autoAlpha: 1 });
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
      <img className="home-hero-layer is-sky" src="/images/hero/khiva-sky.webp" alt="" width={1600} height={922} fetchPriority="high" draggable={false} />
      <img className="home-hero-layer is-city" src="/images/hero/khiva-city.webp" alt="" width={1600} height={922} fetchPriority="high" draggable={false} />
      <span className="home-hero-shade" />

      <div className="home-hero-stage">
        <div className="home-hero-word" aria-hidden="true">
          <span className="home-hero-word-inner">
            {WORD.split("").map((letter, index) => (
              <span key={index} className="home-hero-letter">
                {letter}
              </span>
            ))}
          </span>
        </div>

        <div className="home-hero-copy">
          <p className="home-hero-eyebrow">{t({ ru: "Медицинский туризм в Узбекистане", uz: "Oʻzbekistonda tibbiy turizm", en: "Medical tourism in Uzbekistan" })}</p>
          <h1 id="home-hero-title" className="home-hero-title is-split-pending">
            {t({ ru: "Медицина, которой можно доверять", uz: "Ishonsa boʻladigan tibbiyot", en: "Medicine you can trust" })}
          </h1>
          <div className="home-hero-actions">
            <a href="#catalog" className="pill-btn is-light" onClick={toCatalog}>
              {t({ ru: "Найти клинику", uz: "Klinika topish", en: "Find a clinic" })}
              <span className="pill-btn-icon">
                <ArrowIcon />
              </span>
            </a>
            <Link to="/checker" className="pill-btn is-outline-light">
              {t({ ru: "Подобрать направление", uz: "Yoʻnalish tanlash", en: "Find a specialty" })}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
