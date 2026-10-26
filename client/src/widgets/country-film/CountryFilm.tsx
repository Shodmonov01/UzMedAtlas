import { useEffect, useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/shared/ui/Reveal";

// The films are 852×478 masters, so one file serves desktop and phones alike.
// Muted on a loop until the sound is turned on.
type FilmProps = {
  id: string;
  src: string;
  poster: string;
  label: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

// Space (px) left around the opened 16:9 card on desktop.
const GAP = 16;

/** Desktop: the stage sticks to the screen while the frame opens from a card into the largest 16:9
 *  card that fits. Phones and reduced motion: an inline 16:9 frame. */
export function CountryFilm() {
  return (
    <Film id="film" src="/videos/tourism/tourism.mp4" poster="/videos/tourism/tourism-poster.jpg" label="Фильм об Узбекистане" eyebrow="Наша страна" title="Узбекистан">
      Узбекистан — край, где гармонично сочетаются древняя история, богатая культура и современное
      развитие. Расположенная в самом сердце Великого шёлкового пути, эта страна покоряет путешественников
      со всего мира жемчужинами Самарканда, Бухары и Хивы, величественными горами и неповторимой природой.
    </Film>
  );
}

export function AssociationFilm() {
  return (
    <Film
      id="association-film"
      src="/videos/association/association.mp4"
      poster="/videos/association/association-poster.jpg"
      label="Видео о встрече"
      eyebrow="Ассоциация"
      title="Встреча с клиниками долины"
    >
      Представители Ассоциации медицинских организаций встретились с руководителями частных медицинских
      клиник, работающих в Андижанской, Ферганской и Наманганской областях.
    </Film>
  );
}

function Film({ id, src, poster, label, eyebrow, title, children }: FilmProps) {
  const pinRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  const [visible, setVisible] = useState(false);
  // The phone refused to start the film on its own (power or data saving); it is retried on the next tap.
  const [blocked, setBlocked] = useState(false);

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
    // iOS reads the muted attribute for autoplay; React only sets the property.
    if (!sound) video.setAttribute("muted", "");
    else video.removeAttribute("muted");
    if (visible) {
      if (!video.getAttribute("src")) {
        for (const name of ["playsinline", "webkit-playsinline", "autoplay", "loop"]) video.setAttribute(name, "");
        video.src = src;
        video.load();
      }
      void video.play().then(() => setBlocked(false), () => setBlocked(true));
    } else video.pause();
  }, [visible, sound, src]);

  // Power and data saving modes block autoplay but allow play inside a tap, so any tap or swipe starts the film.
  useEffect(() => {
    if (!blocked || !visible) return;
    const video = videoRef.current!;
    const retry = () => void video.play().then(() => setBlocked(false), () => {});
    window.addEventListener("touchend", retry, { passive: true });
    window.addEventListener("touchstart", retry, { passive: true });
    window.addEventListener("click", retry);
    return () => {
      window.removeEventListener("touchend", retry);
      window.removeEventListener("touchstart", retry);
      window.removeEventListener("click", retry);
    };
  }, [blocked, visible]);

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
    void video.play().then(() => setBlocked(false), () => {});
    setSound(on);
  }

  return (
    <div id={id} className="country-film">
      <div ref={pinRef} className="country-film-pin">
        <div className="country-film-stage">
          <div ref={frameRef} className="country-film-frame">
            <video
              ref={videoRef}
              poster={poster}
              muted
              loop
              playsInline
              preload="none"
              aria-label={label}
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
        <Reveal>
          <p className="country-film-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </Reveal>
        <Reveal className="country-film-text" delay={0.12}>
          {children}
        </Reveal>
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
