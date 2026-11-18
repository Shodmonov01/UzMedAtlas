import { useRef, useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ChatCircleDots, SealCheck, Stethoscope, Tag } from "@phosphor-icons/react";
import { m, type Variants } from "motion/react";
import { ScrollTrigger, glideTo, useGSAP } from "@/shared/lib/gsap";
import { useIntroDone } from "@/shared/lib/intro";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";

const POINTS = [
  { icon: SealCheck, text: "Vetted private clinics" },
  { icon: Tag, text: "Clear prices before you travel" },
  { icon: ChatCircleDots, text: "A reply within 24 hours" },
];

/** The site's easing: a quick start that settles slowly. */
const EASE = [0.16, 1, 0.3, 1] as const;

/** The photo eases back from a slight zoom while the curtain lifts. */
const settle: Variants = {
  hidden: { scale: 1.06 },
  shown: { scale: 1, transition: { duration: 1.6, ease: EASE } },
};
/** Copy rises a little and fades in; `custom` is its delay. */
const rise: Variants = {
  hidden: { opacity: 0, y: 16 },
  shown: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay } }),
};
/** A title word slides up out of its own line; `custom` is its delay. */
const lift: Variants = {
  hidden: { y: "112%" },
  shown: (delay: number) => ({ y: "0%", transition: { duration: 0.9, ease: EASE, delay } }),
};

const TITLE = ["Medicine", "you", "can"];

/** The home page opens on a surgeon in the operating room over the whole screen: the surgeon on the
 *  right, the copy on the open blue to the left. Upright screens get the MEDGUIDE UZ cover portrait instead, with the
 *  copy below the face. Both photos come in several widths, picked by the size they are shown at, so they stay sharp.
 *  It comes in as the opening loader lifts (Motion): the photo settles from a slight zoom, the title words slide up
 *  one after another, then the lead, the buttons and the promise bar. With reduced motion it is simply there. */
export function HomeHero() {
  const root = useRef<HTMLElement>(null);
  const introDone = useIntroDone();
  const [still] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useGSAP(
    () => {
      // This trigger only tells the header how long it sits over the photo
      // (until the hero's bottom edge is 80px from the top of the screen).
      ScrollTrigger.create({ id: "home-hero", trigger: root.current, start: "top top", end: "bottom top+=80" });
    },
    { scope: root },
  );

  function toCatalog(event: MouseEvent<HTMLAnchorElement>) {
    if (glideTo("catalog")) event.preventDefault();
  }

  return (
    <m.section
      ref={root}
      className="home-hero"
      aria-labelledby="home-hero-title"
      initial={still ? false : "hidden"}
      animate={still || introDone ? "shown" : "hidden"}
    >
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
        <m.img
          variants={settle}
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
          <m.p className="home-hero-eyebrow" variants={rise} custom={0.1}>
            <img src="/brand/logo.svg?v=2" alt="" width={24} height={24} />
            MEDGUIDE UZ
          </m.p>
          <h1 id="home-hero-title" className="home-hero-title">
            {TITLE.map((word, i) => (
              <span key={word}>
                <span className="hero-word">
                  <m.span variants={lift} custom={0.18 + i * 0.06}>
                    {word}
                  </m.span>
                </span>{" "}
              </span>
            ))}
            <span className="hero-word">
              <m.em variants={lift} custom={0.18 + TITLE.length * 0.06}>
                trust
              </m.em>
            </span>
          </h1>
          <m.p className="home-hero-lead" variants={rise} custom={0.45}>
            One catalog of vetted private clinics across Uzbekistan. Compare doctors, prices and equipment, then send a
            request in a few clicks.
          </m.p>
          <m.div className="home-hero-actions" variants={rise} custom={0.55}>
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
          </m.div>
        </div>

        {/* Three short promises on a white bar along the bottom of the hero. */}
        <m.ul className="home-hero-points" variants={rise} custom={0.7}>
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <i aria-hidden="true">
                <Icon size={16} weight="bold" />
              </i>
              {text}
            </li>
          ))}
        </m.ul>
      </div>
    </m.section>
  );
}
