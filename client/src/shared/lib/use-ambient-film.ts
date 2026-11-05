import { useEffect, useState, type RefObject } from "react";

type Options = {
  /** Desktop and phone cuts of the film; phones get the light portrait cut so the first frames arrive quickly. */
  desktop: string;
  mobile: string;
  /** Start loading at once (the hero) instead of when the film comes near the screen. */
  eager?: boolean;
};

/** A muted ambient loop that plays only while it is on screen and goes quiet again when it leaves.
 *  iOS decides on autoplay from the attributes present when the source is set, and React never writes the muted
 *  attribute, so the element is prepared here first and only then given its source. Phones that refuse to autoplay
 *  (low power or data saving) get another try on every touch and on return to the tab.
 *  With reduced motion a lazy film keeps its poster until the reader turns the sound on. */
export function useAmbientFilm(ref: RefObject<HTMLVideoElement | null>, { desktop, mobile, eager = false }: Options) {
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const film = ref.current;
    if (!film) return;
    film.muted = true;
    film.defaultMuted = true;
    for (const name of ["muted", "playsinline", "webkit-playsinline", "loop"]) film.setAttribute(name, "");

    const still = !eager && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = eager;
    const load = () => {
      if (film.getAttribute("src")) return;
      film.src = window.matchMedia("(max-width: 767px)").matches ? mobile : desktop;
      film.load();
    };
    const play = () => {
      if (visible && !still && !document.hidden && film.paused) void film.play().catch(() => {});
    };

    if (eager) {
      film.setAttribute("autoplay", "");
      load();
      play();
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          if (!still) load();
          play();
        } else {
          film.pause();
          if (!film.muted) {
            film.muted = true;
            setSound(false);
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(film);

    const gestures = ["touchstart", "pointerdown", "keydown"] as const;
    gestures.forEach((name) => window.addEventListener(name, play, { passive: true }));
    film.addEventListener("loadeddata", play);
    film.addEventListener("canplay", play);
    document.addEventListener("visibilitychange", play);
    return () => {
      observer.disconnect();
      gestures.forEach((name) => window.removeEventListener(name, play));
      film.removeEventListener("loadeddata", play);
      film.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", play);
    };
  }, [ref, desktop, mobile, eager]);

  function toggleSound() {
    const film = ref.current;
    if (!film) return;
    if (!film.getAttribute("src")) {
      film.src = window.matchMedia("(max-width: 767px)").matches ? mobile : desktop;
      film.load();
    }
    film.muted = !film.muted;
    if (!film.muted) void film.play().catch(() => {});
    setSound(!film.muted);
  }

  return { sound, toggleSound };
}
