import { useEffect, useRef, useState } from "react";

// The country film (mountains, Samarkand, Bukhara, Khiva, Tashkent at night), cut down from the 4K
// master: 1080p for desktop, a lighter 720p for phones. Muted on a loop until the sound is turned on.
const FILM = "/videos/uzbekistan.mp4";
const FILM_MOBILE = "/videos/uzbekistan-720.mp4";
const POSTER = "/videos/uzbekistan-poster.jpg";

// Space (px) left around the opened 16:9 card on desktop.
const GAP = 16;

/** Desktop: the stage sticks to the screen while the frame opens from a card into the largest 16:9
 *  card that fits. Phones and reduced motion: an inline 16:9 frame. */
export function CountryFilm() {
  const pinRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Starts a little before the frame scrolls in, so the first frames are buffered by the time it shows.
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "50% 0px" });
    io.observe(frameRef.current!);
    return () => io.disconnect();
  }, []);

  // Not fetched with the page (it would compete with the hero on a slow line); the source is picked
  // the first time the frame comes near, then the film streams only while on screen.
  useEffect(() => {
    const video = videoRef.current!;
    video.muted = !sound;
    if (visible) {
      if (!video.getAttribute("src")) {
        video.src = window.matchMedia("(max-width: 767px)").matches ? FILM_MOBILE : FILM;
        video.load();
      }
      void video.play().catch(() => {});
    } else video.pause();
  }, [visible, sound]);

  useEffect(() => {
    const pin = pinRef.current!;
    const frame = frameRef.current!;
    const query = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    let raf = 0;

    const update = () => {
      raf = 0;
      if (!query.matches) {
        frame.style.clipPath = "";
        frame.style.removeProperty("--film-x");
        frame.style.removeProperty("--film-y");
        return;
      }
      const W = window.innerWidth;
      const H = window.innerHeight;
      const scrollable = pin.offsetHeight - H;
      const p = Math.min(1, Math.max(0, -pin.getBoundingClientRect().top / (scrollable * 0.85)));
      const w = Math.min(W - GAP * 2, ((H - GAP * 2) * 16) / 9);
      const x = lerp(22, ((W - w) / 2 / W) * 100, p);
      const y = lerp(14, ((H - (w * 9) / 16) / 2 / H) * 100, p);
      frame.style.clipPath = `inset(${y}% ${x}% ${y}% ${x}% round ${lerp(48, 32, p)}px)`;
      frame.style.setProperty("--film-scale", String(lerp(1.08, 1, p)));
      // The sound toggle follows the open card's corner, so it is visible from the first frame.
      frame.style.setProperty("--film-x", `${x}%`);
      frame.style.setProperty("--film-y", `${y}%`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    query.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      query.removeEventListener("change", schedule);
    };
  }, []);

  // A tap on the sound toggle is a user gesture, so it also starts the film where autoplay was refused.
  function toggleSound() {
    const video = videoRef.current!;
    const on = !sound;
    video.muted = !on;
    void video.play().catch(() => {});
    setSound(on);
  }

  return (
    <div className="country-film">
      <div ref={pinRef} className="country-film-pin">
        <div className="country-film-stage">
          <div ref={frameRef} className="country-film-frame">
            <video
              ref={videoRef}
              poster={POSTER}
              muted
              loop
              playsInline
              preload="none"
              aria-label="Фильм об Узбекистане"
              className="country-film-video"
            />
            <span className="country-film-shade" />
            <div className="country-film-box">
              <button type="button" className="country-film-sound" onClick={toggleSound} aria-pressed={sound}>
                {sound ? <SpeakerOn /> : <SpeakerOff />}
                {sound ? "Выключить звук" : "Включить звук"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="country-film-caption">
        <div data-reveal>
          <p className="country-film-eyebrow">Наша страна</p>
          <h2>Узбекистан</h2>
        </div>
        <p className="country-film-text" data-reveal data-reveal-delay="80">
          Узбекистан — край, где гармонично сочетаются древняя история, богатая культура и современное
          развитие. Расположенная в самом сердце Великого шёлкового пути, эта страна покоряет путешественников
          со всего мира жемчужинами Самарканда, Бухары и Хивы, величественными горами и неповторимой природой.
        </p>
      </div>
    </div>
  );
}

function lerp(from: number, to: number, p: number) {
  return from + (to - from) * p;
}

function SpeakerOn() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 9v6h4l5 4V5L7 9H3Zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4ZM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6Z" />
    </svg>
  );
}

function SpeakerOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 9v6h4l5 4V5L7 9H3Zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4-2.7-2.7Z" />
    </svg>
  );
}
