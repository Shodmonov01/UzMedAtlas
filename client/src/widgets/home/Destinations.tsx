import { useRef, useState } from "react";
import { MOTION_OK, SplitText, gsap, useGSAP } from "@/shared/lib/gsap";

const PLACES = [
  {
    photo: "samarkand",
    city: "Samarkand",
    place: "Registan Square",
    text: "Three madrasas around one square, blue domes and the tile work of Timur's capital.",
    facts: ["UNESCO World Heritage", "2 h from Tashkent by fast train"],
    alt: "Registan Square in Samarkand with its three madrasas",
  },
  {
    photo: "bukhara",
    city: "Bukhara",
    place: "Kalyan Minaret",
    text: "A living old town of trading domes, quiet courtyards and a minaret nine centuries old.",
    facts: ["UNESCO World Heritage", "About 4 h by fast train"],
    alt: "The Kalyan Minaret in Bukhara at sunset",
  },
  {
    photo: "khiva",
    city: "Khiva",
    place: "Itchan Kala",
    text: "A whole walled city of clay, minarets and carved wooden doors, best at sunset.",
    facts: ["UNESCO World Heritage", "A short flight to Urgench"],
    alt: "The Kalta Minor minaret and Muhammad Amin Khan madrasa in Khiva",
  },
];

/** The Silk Road cities next to the treatment. On the left a light stacked heading and a numbered list of the cities;
 *  on the right the same cities as tall photo panels: the chosen one opens wide with its story and two facts, the
 *  others stay narrow (on phones the panels stack and the chosen one grows taller). Hover, focus or a tap choose a
 *  city. The heading rises line by line and the panels open from the bottom as the section comes in. With reduced
 *  motion everything is simply shown and the panels swap without easing. */
export function Destinations() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const trigger = () => ({ trigger: root.current, start: "top 70%", once: true });
        SplitText.create(".dest-title", {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.3, stagger: 0.1, ease: "expo.out", scrollTrigger: trigger() }),
        });
        gsap.from([".dest-kicker", ".dest-text", ".dest-list li"], { y: 20, autoAlpha: 0, duration: 1, stagger: 0.07, delay: 0.25, scrollTrigger: trigger() });
        gsap.fromTo(
          ".dest-panel",
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, stagger: 0.12, ease: "expo.inOut", clearProps: "clipPath", scrollTrigger: trigger() },
        );
        gsap.from(".dest-panel-photo", { scale: 1.3, duration: 1.8, stagger: 0.12, ease: "expo.out", clearProps: "transform", scrollTrigger: trigger() });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="dest" aria-labelledby="dest-title">
      <div className="wrap dest-inner">
        <div className="dest-head">
          <p className="dest-kicker eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Where you recover
          </p>
          <h2 id="dest-title" className="dest-title">
            Heritage.
            <br />
            Nature.
            <br />
            Rest.
          </h2>
          <p className="dest-text">Between appointments the Silk Road is close by: blue domes, old streets and quiet courtyards.</p>

          <ol className="dest-list">
            {PLACES.map((p, i) => (
              <li key={p.photo}>
                <button
                  type="button"
                  className={`dest-list-item${i === active ? " is-active" : ""}`}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                >
                  <span className="dest-list-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="dest-list-city">{p.city}</span>
                  <span className="dest-list-place">{p.place}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="dest-panels">
          {PLACES.map((p, i) => (
            <article
              key={p.photo}
              className={`dest-panel${i === active ? " is-active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={p.city}
            >
              <img
                className="dest-panel-photo"
                src={`/images/discover/${p.photo}-800.webp`}
                srcSet={`/images/discover/${p.photo}-800.webp 800w, /images/discover/${p.photo}.webp 1800w`}
                sizes="(max-width: 1023px) 100vw, 50vw"
                alt={p.alt}
                loading="lazy"
                decoding="async"
              />
              <span className="dest-panel-shade" aria-hidden="true" />
              <div className="dest-panel-body">
                <span className="dest-panel-num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="dest-panel-city">{p.city}</h3>
                <div className="dest-panel-more" aria-hidden={i !== active}>
                  <div>
                    <p className="dest-panel-text">{p.text}</p>
                    <ul className="dest-panel-facts">
                      {p.facts.map((fact) => (
                        <li key={fact}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
