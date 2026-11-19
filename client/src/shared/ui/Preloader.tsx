import { m } from "motion/react";
import { useEffect, useState } from "react";
import { finishIntro } from "@/shared/lib/intro";
import { initialLang } from "@/shared/i18n/lang";

/** The brand under the logo; the loader runs before the page (outside the language provider), so it reads the
 *  remembered language itself. */
const BRAND = {
  ru: { title: "Ассоциация", sub: "медицинских организаций" },
  uz: { title: "Assotsiatsiya", sub: "tibbiyot tashkilotlari" },
  en: { title: "Association", sub: "of Medical Organizations" },
} as const;

const LOGO = "/brand/logo.svg?v=2";

/** A quick start that settles slowly (the mark and the name coming in). */
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** Slow at both ends (the curtain). */
const EASE_CURTAIN = [0.87, 0, 0.13, 1] as const;
/** Speeds up as it goes (the mark and the name leaving). */
const EASE_IN = [0.55, 0.06, 0.68, 0.19] as const;
/** Gentle both ways (the breathing). */
const EASE_BREATHE = [0.37, 0, 0.63, 1] as const;

/** The intro (mark and name) never waits longer than this for the logo and the webfont… */
const ASSETS_MAX_MS = 4000;
/** …and the curtain never waits longer than this (from the start) for the home hero photo. */
const PHOTO_MAX_MS = 3500;
/** How long the mark and the name take to come in. */
const INTRO_MS = 1100;
/** The hero starts its entrance this long after the curtain begins to lift; the curtain is gone after LEAVE_MS. */
const HAND_OVER_MS = 450;
const LEAVE_MS = 1150;

type Stage = "waiting" | "intro" | "breathing" | "leaving" | "gone";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** The home hero photo, downloaded and decoded (or nothing to wait for on other pages). */
function heroPhoto(alive: () => boolean) {
  if (window.location.pathname !== "/") return Promise.resolve();
  return new Promise<void>((resolve) => {
    // The page's code arrives in its own file, so the photo may not be in the document yet.
    const look = () => {
      if (!alive()) return resolve();
      const img = document.querySelector<HTMLImageElement>(".home-hero-photo");
      if (!img) {
        requestAnimationFrame(look);
        return;
      }
      img.decode().then(resolve, resolve);
    };
    look();
  });
}

/** The opening loader, as on uztta.uz: on the site's paper the logo turns and grows into place with the association's
 *  name sliding up below it, then the logo breathes until the first page (on the home page: the hero photo) is ready;
 *  the two lift away and the paper is wiped up from the bottom like a curtain, while the home hero makes its entrance.
 *  The boot screen of index.html is the same empty paper, so the handover is invisible. Skipped in the cabinet and the
 *  moderation desk. */
export function Preloader() {
  const [lang] = useState(initialLang);
  const [active] = useState(() => !/^\/(cabinet|moderation)(\/|$)/.test(window.location.pathname));
  const [stage, setStage] = useState<Stage>(active ? "waiting" : "gone");
  const [still] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (!active) {
      finishIntro();
      return;
    }
    let alive = true;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => alive && fn(), ms));

    const logo = new Image();
    logo.src = LOGO;
    const assets = Promise.race([
      Promise.all([logo.decode().catch(() => undefined), document.fonts?.ready]),
      wait(ASSETS_MAX_MS),
    ]);
    const photo = Promise.race([heroPhoto(() => alive), wait(PHOTO_MAX_MS)]);

    void (async () => {
      await assets;
      if (!alive) return;
      setStage("intro");
      await wait(still ? 200 : INTRO_MS);
      if (!alive) return;
      setStage("breathing");
      await photo;
      if (!alive) return;
      setStage("leaving");
      later(still ? 0 : HAND_OVER_MS, finishIntro);
      later(still ? 300 : LEAVE_MS, () => setStage("gone"));
    })();

    return () => {
      alive = false;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [active, still]);

  // The page under the paper stays where it is: no wheel or touch scrolling until the curtain is up.
  const covering = stage !== "gone";
  useEffect(() => {
    if (!covering) return;
    const hold = (event: Event) => event.preventDefault();
    window.addEventListener("wheel", hold, { passive: false });
    window.addEventListener("touchmove", hold, { passive: false });
    return () => {
      window.removeEventListener("wheel", hold);
      window.removeEventListener("touchmove", hold);
    };
  }, [covering]);

  if (!covering) return null;
  const shown = stage !== "waiting";
  const leaving = stage === "leaving";

  return (
    <m.div
      className="preloader"
      aria-hidden="true"
      initial={still ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)" }}
      animate={leaving ? (still ? { opacity: 0 } : { clipPath: "inset(0% 0% 100% 0%)" }) : undefined}
      transition={still ? { duration: 0.3 } : { duration: 0.9, delay: 0.25, ease: EASE_CURTAIN }}
    >
      <m.div
        className="preloader-inner"
        animate={leaving && !still ? { y: -24, opacity: 0 } : undefined}
        transition={{ duration: 0.45, ease: EASE_IN }}
      >
        <div className="preloader-stack">
          <m.span
            className="preloader-breathe"
            animate={stage === "breathing" && !still ? { scale: 0.92 } : { scale: 1 }}
            transition={
              stage === "breathing"
                ? { duration: 0.9, ease: EASE_BREATHE, repeat: Infinity, repeatType: "reverse" }
                : { duration: 0.3, ease: "easeOut" }
            }
          >
            <m.img
              src={LOGO}
              alt=""
              className="preloader-mark"
              draggable={false}
              initial={still ? { opacity: 0 } : { scale: 0.4, rotate: -120, opacity: 0 }}
              animate={shown ? { scale: 1, rotate: 0, opacity: 1 } : undefined}
              transition={{ duration: still ? 0.2 : 1, ease: EASE_OUT }}
            />
          </m.span>
          <span className="preloader-word-mask">
            <m.span
              className="preloader-word"
              initial={{ y: "110%" }}
              animate={shown ? { y: "0%" } : undefined}
              transition={{ duration: still ? 0.2 : 0.8, delay: still ? 0 : 0.3, ease: EASE_OUT }}
            >
              <span>{BRAND[lang].title}</span>
              <span>{BRAND[lang].sub}</span>
            </m.span>
          </span>
        </div>
      </m.div>
    </m.div>
  );
}
