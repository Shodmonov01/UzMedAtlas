import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { MOTION_OK, gsap, useGSAP } from "@/shared/lib/gsap";

const SLIDES = [
  { photo: "lake", title: "Mountain lakes", text: "Turquoise water and cool air, a short drive from Tashkent.", alt: "A turquoise mountain lake between green hills" },
  { photo: "alpine-lake", title: "Alpine silence", text: "High lakes under snowy peaks, for slow walks and deep breaths.", alt: "A still alpine lake under snowy peaks" },
  { photo: "valley", title: "Green valleys", text: "Winding roads, orchards and wide views for the days after treatment.", alt: "A road winding through a green mountain valley" },
];

/** Rest after treatment: a large photo with its name on the left, a quiet statement and the slide controls on the
 *  right (stacked on phones). The photos cross-fade (CSS), the caption rises in on each change; the section itself
 *  opens from the left as it comes in. With reduced motion only the photos swap. */
export function Recovery() {
  const root = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const go = (step: number) => setIndex((i) => (i + step + SLIDES.length) % SLIDES.length);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const trigger = () => ({ trigger: root.current, start: "top 72%", once: true });
        gsap.fromTo(".rest-stage", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", clearProps: "clipPath", scrollTrigger: trigger() });
        gsap.from(".rest-stage", { "--rest-zoom": 1.2, duration: 2, ease: "expo.out", scrollTrigger: trigger() });
        gsap.from(".rest-side > *", { y: 24, autoAlpha: 0, duration: 1, stagger: 0.1, delay: 0.4, scrollTrigger: trigger() });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="rest" aria-labelledby="rest-title">
      <div className="wrap rest-inner">
        <div className="rest-stage">
          {SLIDES.map((s, i) => (
            <img
              key={s.photo}
              className={`rest-photo${i === index ? " is-active" : ""}`}
              src={`/images/discover/${s.photo}-800.webp`}
              srcSet={`/images/discover/${s.photo}-800.webp 800w, /images/discover/${s.photo}.webp 1800w`}
              sizes="(max-width: 1023px) 100vw, 62vw"
              alt={i === index ? s.alt : ""}
              aria-hidden={i === index ? undefined : true}
              loading="lazy"
              decoding="async"
            />
          ))}
          <span className="rest-shade" aria-hidden="true" />
          <div className="rest-caption" key={slide.photo} aria-live="polite">
            <p className="rest-kicker">After treatment</p>
            <h2 id="rest-title" className="rest-title">
              {slide.title}
            </h2>
            <p className="rest-text">{slide.text}</p>
          </div>
        </div>

        <div className="rest-side">
          <span className="rest-quote-mark" aria-hidden="true">
            “
          </span>
          <p className="rest-quote">Treatment is half of the trip. The other half is rest, and Uzbekistan has plenty of room for it.</p>
          <p className="rest-sign">Recovery in Uzbekistan</p>
          <div className="rest-controls">
            <p className="rest-count">
              <span>{String(index + 1).padStart(2, "0")}</span> / {String(SLIDES.length).padStart(2, "0")}
            </p>
            <div className="rest-buttons">
              <button type="button" className="rest-btn" onClick={() => go(-1)} aria-label="Previous photo">
                <ArrowLeft size={18} weight="bold" />
              </button>
              <button type="button" className="rest-btn" onClick={() => go(1)} aria-label="Next photo">
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
