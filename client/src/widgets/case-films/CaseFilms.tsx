import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/shared/ui/Reveal";

// Vertical 720×1280 clips of the association's work with clinics, shown one after another.
const CASES = [
  {
    src: "/videos/cases/case-1.mp4",
    poster: "/videos/cases/case-1-poster.jpg",
    tag: "Консалтинг",
    title: "Клинике «Miracle IVF» оказана консалтинговая услуга по продлению срока действия лицензии",
  },
  {
    src: "/videos/cases/case-2.mp4",
    poster: "/videos/cases/case-2-poster.jpg",
    tag: "Сотрудничество",
    title: "Встреча с представителями Apollo Hospitals",
  },
  {
    src: "/videos/cases/case-3.mp4",
    poster: "/videos/cases/case-3-poster.jpg",
    tag: "Правовая помощь",
    title: "Клинике «ID Med Center» оказана правовая поддержка",
  },
];

/** Desktop: the stage sticks to the screen and each screen of scrolling brings in the next clip.
 *  Phones and reduced motion: the clips stack, and the one in view plays. */
export function CaseFilms() {
  const pinRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  const [sound, setSound] = useState(false);

  // Clips are not fetched with the page; they load once the section comes near.
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: "50% 0px" });
    io.observe(pinRef.current!);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const pin = pinRef.current!;
    const pinned = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    let raf = 0;

    const update = () => {
      raf = 0;
      if (pinned.matches) {
        const scrollable = pin.offsetHeight - window.innerHeight;
        const p = Math.min(0.999, Math.max(0, -pin.getBoundingClientRect().top / scrollable));
        setActive(Math.floor(p * CASES.length));
        return;
      }
      // Stacked: the clip whose centre is closest to the screen centre plays.
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDistance = Infinity;
      itemRefs.current.forEach((item, i) => {
        if (!item) return;
        const r = item.getBoundingClientRect();
        const distance = Math.abs(r.top + r.height / 2 - mid);
        if (distance < bestDistance) [best, bestDistance] = [i, distance];
      });
      setActive(best);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    pinned.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      pinned.removeEventListener("change", schedule);
    };
  }, []);

  // Only the active clip plays; the others pause where they are.
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      const on = near && i === active;
      video.muted = !(on && sound);
      // iOS reads the muted attribute for autoplay; React only sets the property.
      if (video.muted) video.setAttribute("muted", "");
      else video.removeAttribute("muted");
      if (on) {
        if (!video.getAttribute("src")) {
          video.src = CASES[i].src;
          video.load();
        }
        void video.play().catch(() => {});
      } else video.pause();
    });
  }, [active, near, sound]);

  // A tap on the toggle is a user gesture, so it also starts the clip where autoplay was refused.
  function toggleSound() {
    const video = videoRefs.current[active];
    const on = !sound;
    if (video) {
      video.muted = !on;
      void video.play().catch(() => {});
    }
    setSound(on);
  }

  return (
    <section id="cases" className="cases">
      <div ref={pinRef} className="cases-pin">
        <div className="cases-stage">
          <div className="cases-copy">
            <Reveal>
              <p className="cases-eyebrow">Наша работа</p>
              <h2>Помогаем клиникам расти</h2>
            </Reveal>
            <ol className="cases-steps">
              {CASES.map((item, i) => (
                <li key={item.src} className={i === active ? "is-active" : undefined}>
                  <span className="cases-step-number">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <small>{item.tag}</small>
                    <strong>{item.title}</strong>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="cases-films">
            {CASES.map((item, i) => (
              <article
                key={item.src}
                ref={(node) => {
                  itemRefs.current[i] = node;
                }}
                className={`cases-film${i === active ? " is-active" : i < active ? " is-past" : ""}`}
              >
                <div className="cases-frame">
                  <video
                    ref={(node) => {
                      videoRefs.current[i] = node;
                    }}
                    poster={item.poster}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-label={item.title}
                  />
                  <button type="button" className="cases-sound" onClick={toggleSound} aria-pressed={sound}>
                    {sound ? "Выключить звук" : "Включить звук"}
                  </button>
                </div>
                <p className="cases-film-caption">
                  <small>{item.tag}</small>
                  {item.title}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
