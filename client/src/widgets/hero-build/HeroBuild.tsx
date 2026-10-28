import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { revealItem } from "@/shared/ui/Reveal";
import { SoundToggle } from "@/shared/ui/SoundToggle";

const STATEMENT =
  "Ассоциация объединяет клиники Узбекистана, чтобы выбор врача был таким же понятным, как дорога домой: проверенные данные, честные цены и живые контакты — в одном месте.";

// The "about" layer is off the page while its design is being agreed; set to true to bring it back.
const SHOW_ABOUT = false;

/** Photos on the "about" wheel. An empty entry shows a marked slot for its photo (4:5, from 1000×1250). */
const ABOUT_PHOTOS: (string | undefined)[] = [undefined, undefined, undefined, undefined, undefined];

/** The home page opens on a muted HD loop from the country film over the whole screen, the headline in its bottom
 *  left corner. The hero stays pinned while the next section slides up over it as a second layer. There the statement lights up word by word
 *  and the photo cards ride an endless wheel: the scroll turns it once around, each card swinging in from below,
 *  resting in front and swinging out above; whenever the scroll rests, the wheel keeps turning on its own.
 *  Reduced motion: the poster frame, the full statement and the first card, without the pinned stages. */
export function HeroBuild() {
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // The film starts muted (browsers only autoplay silent video); the sound button turns its audio on and off.
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const hero = heroRef.current!;
    const story = storyRef.current;
    const words = story ? [...story.querySelectorAll<HTMLElement>(".hero-story-word")] : [];
    const cards = story ? [...story.querySelectorAll<HTMLElement>(".about-card")] : [];
    const count = story?.querySelector<HTMLElement>(".about-count-current");
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let raf = 0;
    // Progress values ease toward the scroll position, so the layers and cards glide instead of jumping.
    let covered = 0;
    let read = 0;
    // Steps the wheel has turned by itself, and when the page last scrolled.
    let auto = 0;
    let autoTarget = 0;
    let lastScroll = 0;

    const update = () => {
      raf = 0;
      const H = window.innerHeight;
      // The section after the hero (the "about" layer, or the country deck) rises over it on the first screen of scroll.
      const coveredTarget = query.matches ? span(-hero.getBoundingClientRect().top / H, 0, 1) : 0;
      const readTarget = story && query.matches ? progress(story, H) : 1;
      covered = approach(covered, coveredTarget);
      read = approach(read, readTarget);
      auto = approach(auto, autoTarget, 0.08);
      if (covered !== coveredTarget || read !== readTarget || auto !== autoTarget) schedule();

      hero.style.setProperty("--hp", covered.toFixed(4));
      // Once the next layer has covered the hero, its sound goes quiet again.
      if (coveredTarget >= 1 && !film.muted) {
        film.muted = true;
        setSound(false);
      }
      words.forEach((word, i) => {
        const at = 0.04 + (i / words.length) * 0.4;
        word.style.opacity = String(0.16 + 0.84 * span(read, at, at + 0.06));
      });
      // The scroll turns the wheel once around, resting a moment on each card; the auto steps add on top.
      const turned = query.matches ? span(read, 0.02, 0.92) * cards.length : 0;
      const turn = Math.floor(turned) + ease(turned - Math.floor(turned)) + auto;
      const n = cards.length;
      cards.forEach((card, i) => {
        // Steps from the front, wrapped into -n/2..n/2 so the ring is endless; the wrap happens out of sight.
        const away = ((((turn - i) % n) + n + n / 2) % n) - n / 2;
        card.style.setProperty("--d", away.toFixed(4));
        card.style.opacity = String(Math.max(0, 1 - Math.abs(away) * 0.55));
        card.style.setProperty("--s", (1 - Math.min(1, Math.abs(away)) * 0.12).toFixed(4));
        card.style.zIndex = String(10 - Math.round(Math.abs(away) * 2));
      });
      if (count) count.textContent = String((((Math.round(turn) % n) + n) % n) + 1).padStart(2, "0");
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onScroll = () => {
      lastScroll = performance.now();
      schedule();
    };
    // While the wheel is on screen and the scroll rests, it turns one card further every few seconds.
    const tick = window.setInterval(() => {
      if (!story) return;
      const box = story.getBoundingClientRect();
      const onScreen = box.top < window.innerHeight / 2 && box.bottom > window.innerHeight / 2;
      if (query.matches && onScreen && !document.hidden && performance.now() - lastScroll > 1500) {
        autoTarget += 1;
        schedule();
      }
    }, 3000);
    // The hero film is a muted ambient loop and always plays. iOS decides on autoplay from the attributes present when
    // the source is set, and React never writes the muted attribute, so the element is prepared here first and only
    // then given its source (also picked here: <source media> is ignored by some Android browsers). Phones get a
    // light portrait cut, so the first frames arrive quickly. Phones that still refuse (low power or data saving) get
    // another try once data has arrived, on every touch and on return to the tab.
    const film = videoRef.current!;
    film.muted = true;
    film.defaultMuted = true;
    for (const name of ["muted", "playsinline", "webkit-playsinline", "autoplay", "loop"]) film.setAttribute(name, "");
    if (!film.getAttribute("src")) {
      film.src = window.matchMedia("(max-width: 767px)").matches ? "/videos/hero/meet-mobile.mp4" : "/videos/hero/meet-1080.mp4";
      film.load();
    }
    void film.play().catch(() => {});
    const syncFilm = () => {
      if (film.paused && !document.hidden) void film.play().catch(() => {});
    };
    const gestures = ["touchstart", "touchend", "pointerdown", "click", "keydown"] as const;
    gestures.forEach((name) => window.addEventListener(name, syncFilm, { passive: true }));
    film.addEventListener("loadeddata", syncFilm);
    film.addEventListener("canplay", syncFilm);
    document.addEventListener("visibilitychange", syncFilm);

    update();
    syncFilm();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    query.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(tick);
      gestures.forEach((name) => window.removeEventListener(name, syncFilm));
      film.removeEventListener("loadeddata", syncFilm);
      film.removeEventListener("canplay", syncFilm);
      document.removeEventListener("visibilitychange", syncFilm);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      query.removeEventListener("change", schedule);
    };
  }, []);

  function toggleSound() {
    const film = videoRef.current!;
    film.muted = !film.muted;
    if (!film.muted) void film.play().catch(() => {});
    setSound(!film.muted);
  }

  return (
    <>
      <section ref={heroRef} className="hero-build">
        <div className="hero-build-stage">
          <video ref={videoRef} className="hero-build-photo" poster="/videos/hero/meet-poster.jpg" muted loop playsInline preload="auto" aria-hidden="true" />
          <span className="hero-build-shade" />

          <motion.div
            className="hero-build-copy"
            initial="hidden"
            animate="shown"
            variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } } }}
          >
            <motion.p className="hero-build-eyebrow" variants={revealItem}>Каталог клиник Узбекистана</motion.p>
            <motion.h1 variants={revealItem}>
              <em>Медицина,</em> которой
              <br />
              <em>можно</em> доверять
            </motion.h1>
            <motion.p className="hero-build-lead" variants={revealItem}>Клиники, услуги и специалисты Узбекистана — в одном месте, чтобы выбор был понятным и спокойным.</motion.p>
          </motion.div>
          <SoundToggle on={sound} onToggle={toggleSound} className="hero-build-sound" />
        </div>
      </section>

      {SHOW_ABOUT ? (
        <div ref={storyRef} id="about" className="hero-story">
          <div className="hero-story-stage">
            <div className="hero-story-copy">
              <p className="hero-story-eyebrow">Об ассоциации</p>
              <p className="hero-story-text">
                {STATEMENT.split(" ").map((word, i) => (
                  <span key={i} className="hero-story-word">{word} </span>
                ))}
              </p>
              <a href="#catalog" className="hero-story-link">Перейти к каталогу</a>
            </div>

            <div className="about-deck">
              {ABOUT_PHOTOS.map((src, i) => (
                <figure key={i} className={`about-card${src ? "" : " is-empty"}`} style={{ "--d": -i } as CSSProperties}>
                  {src ? (
                    <img src={src} alt="" width="1000" height="1250" decoding="async" />
                  ) : (
                    <span className="about-card-slot" aria-hidden="true">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="9" cy="10" r="2" stroke="currentColor" strokeWidth="1.6" />
                        <path d="m4 18 5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      </svg>
                      Фото {i + 1}
                      <small>4:5 · от 1000×1250</small>
                    </span>
                  )}
                </figure>
              ))}
              <p className="about-count" aria-hidden="true">
                <span className="about-count-current">01</span> / {String(ABOUT_PHOTOS.length).padStart(2, "0")}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** 0 while the element's top is at the top of the screen, 1 once its bottom reaches the bottom. */
function progress(element: HTMLElement, H: number) {
  const scrollable = element.offsetHeight - H;
  return scrollable > 0 ? span(-element.getBoundingClientRect().top / scrollable, 0, 1) : 1;
}

function span(p: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (p - from) / (to - from)));
}

function ease(t: number) {
  return t * t * (3 - 2 * t);
}

/** One smoothing step toward `target`; snaps when close enough. */
function approach(value: number, target: number, rate = 0.14) {
  const next = value + (target - value) * rate;
  return Math.abs(target - next) < 0.0005 ? target : next;
}
