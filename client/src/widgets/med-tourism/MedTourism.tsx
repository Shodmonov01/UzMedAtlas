import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/shared/ui/Reveal";
import { SoundToggle } from "@/shared/ui/SoundToggle";

const POINTS = [
  { value: "от 30%", label: "экономии по сравнению с клиниками за рубежом" },
  { value: "24 ч", label: "на ответ клиники и предварительный план лечения" },
  { value: "6 языков", label: "общения с координаторами и врачами" },
];

/** Medical tourism — the second layer pulled up over the pinned hero: the pitch on the left, the country film
 *  (horizons, mountains, valleys) looping muted on the right, with a sound button. The film loads and plays only while it is on screen,
 *  so it never competes with the hero film. Reduced motion: the poster frame. */
export function MedTourism() {
  const filmRef = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const film = filmRef.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Same iOS preparation as the hero film: muted attributes first, the source only after.
    film.muted = true;
    film.defaultMuted = true;
    for (const name of ["muted", "playsinline", "webkit-playsinline", "loop"]) film.setAttribute(name, "");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!film.getAttribute("src")) {
            film.src = window.matchMedia("(max-width: 767px)").matches ? "/videos/medtour/medtour-mobile.mp4" : "/videos/medtour/medtour-1080.mp4";
            film.load();
          }
          void film.play().catch(() => {});
        } else {
          // Off screen the film pauses and goes quiet again.
          film.pause();
          film.muted = true;
          setSound(false);
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(film);
    return () => observer.disconnect();
  }, []);

  function toggleSound() {
    const film = filmRef.current!;
    film.muted = !film.muted;
    if (!film.muted) void film.play().catch(() => {});
    setSound(!film.muted);
  }

  return (
    <section id="medtourism" className="medtour">
      <div className="medtour-inner">
        <Reveal className="medtour-copy">
          <p className="medtour-eyebrow">Медицинский туризм</p>
          <h2 className="medtour-title">
            Лечение и восстановление <em>в Узбекистане</em> — там, где спокойно и рядом
          </h2>
          <p className="medtour-text">
            Горный воздух, тёплое солнце и бескрайние долины — здесь легко восстанавливаться после лечения. Мы подберём
            клинику и врача, заранее согласуем программу и стоимость, поможем с визой, трансфером и проживанием.
          </p>
          <ul className="medtour-points">
            {POINTS.map((point) => (
              <li key={point.value}>
                <strong>{point.value}</strong>
                <span>{point.label}</span>
              </li>
            ))}
          </ul>
          <a href="#catalog" className="medtour-link">Подобрать клинику</a>
        </Reveal>

        <Reveal className="medtour-gallery" delay={0.15}>
          <video ref={filmRef} poster="/videos/medtour/medtour-poster.jpg" muted loop playsInline preload="none" aria-hidden="true" />
          <p className="medtour-caption">Узбекистан — лечение и отдых в одной поездке</p>
          <SoundToggle on={sound} onToggle={toggleSound} className="medtour-sound" />
        </Reveal>
      </div>
    </section>
  );
}
