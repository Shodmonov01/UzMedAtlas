import { useEffect, useRef } from "react";

/** The mission statement in large type with a photo set into it (after aventuradentalarts.com). While the stage is
 *  pinned, scrolling draws the photo toward the viewer: it grows from a small portrait card into the whole screen
 *  as the words behind it blur away, and a caption settles in its corner.
 *  Reduced motion: the statement with the small photo, without the pinned stage. */
export function MissionZoom() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current!;
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let raf = 0;
    let zoom = 0;

    const update = () => {
      raf = 0;
      const scrollable = section.offsetHeight - window.innerHeight;
      const read = scrollable > 0 ? span(-section.getBoundingClientRect().top / scrollable, 0, 1) : 0;
      const target = query.matches ? ease(span(read, 0.08, 0.86)) : 0;
      // Eased toward the scroll position so the photo glides.
      zoom += (target - zoom) * 0.14;
      if (Math.abs(target - zoom) < 0.0005) zoom = target;
      else schedule();
      section.style.setProperty("--z", zoom.toFixed(4));
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

  return (
    <section ref={sectionRef} className="mission">
      <div className="mission-stage">
        <div className="mission-copy">
          <p className="mission-lead">Наша цель —</p>
          <p className="mission-text">
            сделать медицину Узбекистана понятной: проверенные клиники, честные цены и забота, которой можно доверять.
          </p>
        </div>
        <figure className="mission-photo">
          <img
            src="/images/mission/mission-registan.webp"
            srcSet="/images/mission/mission-registan-1280.webp 1280w, /images/mission/mission-registan.webp 2560w"
            sizes="100vw"
            alt="Площадь Регистан в Самарканде вечером"
            width="2560"
            height="1440"
            decoding="async"
          />
          <figcaption>Самарканд · Регистан</figcaption>
        </figure>
      </div>
    </section>
  );
}

function span(p: number, from: number, to: number) {
  return Math.min(1, Math.max(0, (p - from) / (to - from)));
}

function ease(t: number) {
  return t * t * (3 - 2 * t);
}
