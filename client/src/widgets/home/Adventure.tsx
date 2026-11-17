import { useRef, useState } from "react";
import { MOTION_OK, SplitText, glideTo, gsap, useGSAP } from "@/shared/lib/gsap";
import { ArrowIcon } from "@/shared/ui/ArrowIcon";

type Season = "winter" | "summer";

const SEASONS: Record<Season, { label: string; when: string; note: string; photos: { photo: string; title: string; alt: string }[] }> = {
  winter: {
    label: "Winter",
    when: "December to March",
    note: "Ski slopes, snowboard runs and snowmobile rides in the mountains, a short drive from Tashkent.",
    photos: [
      { photo: "ski", title: "Skiing", alt: "A skier in a blue jacket on a snowy slope" },
      { photo: "snowboard", title: "Snowboarding", alt: "A snowboarder riding past a gondola lift" },
      { photo: "snowmobiles", title: "Snowmobiles", alt: "Snowmobiles lined up at the foot of a ski slope" },
    ],
  },
  summer: {
    label: "Summer",
    when: "May to October",
    note: "Mountain trails, waterfalls and rope bridges above the clouds, with clean air for the days after treatment.",
    photos: [
      { photo: "trail", title: "Hiking trails", alt: "A green mountain valley with a river and a lake" },
      { photo: "waterfall", title: "Waterfalls", alt: "A waterfall falling over moss-covered rocks" },
      { photo: "bridge", title: "Rope bridges", alt: "Hikers on a suspension bridge in the fog" },
    ],
  },
};

/** An invitation for travellers: on a light grey panel, a large heading and a Winter/Summer switch, then three photo cards
 *  for the season (one large, two stacked) with their activity on a pill, the season's months and a button to plan
 *  the trip. The heading rises line by line and the cards open from the bottom; switching seasons cross-fades the
 *  cards (CSS). With reduced motion everything is simply shown. */
export function Adventure() {
  const root = useRef<HTMLElement>(null);
  const [season, setSeason] = useState<Season>("winter");
  const current = SEASONS[season];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const trigger = () => ({ trigger: ".trip-panel", start: "top 72%", once: true });
        SplitText.create(".trip-title", {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.3, stagger: 0.1, ease: "expo.out", scrollTrigger: trigger() }),
        });
        gsap.from([".trip-chip", ".trip-switch", ".trip-foot"], { y: 22, autoAlpha: 0, duration: 1, stagger: 0.08, delay: 0.2, scrollTrigger: trigger() });
        gsap.fromTo(
          ".trip-card",
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, stagger: 0.12, delay: 0.15, ease: "expo.inOut", clearProps: "clipPath", scrollTrigger: trigger() },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="adventure" className="trip" aria-labelledby="trip-title">
      <div className="wrap">
        <div className="trip-panel">
          <div className="trip-head">
            <div>
              <p className="trip-chip">Active Uzbekistan</p>
              <h2 id="trip-title" className="trip-title">
                Come for treatment,
                <br />
                <em>stay for the mountains.</em>
              </h2>
            </div>
            <div className="trip-switch" role="group" aria-label="Season">
              {(Object.keys(SEASONS) as Season[]).map((key) => (
                <button key={key} type="button" className={key === season ? "is-active" : undefined} aria-pressed={key === season} onClick={() => setSeason(key)}>
                  {SEASONS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="trip-grid" key={season}>
            {current.photos.map((p, i) => (
              <figure key={p.photo} className={`trip-card${i === 0 ? " is-large" : ""}`}>
                <img
                  src={`/images/discover/${p.photo}-800.webp`}
                  srcSet={`/images/discover/${p.photo}-800.webp 800w, /images/discover/${p.photo}.webp 1800w`}
                  sizes={i === 0 ? "(max-width: 767px) 100vw, 58vw" : "(max-width: 767px) 100vw, 38vw"}
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption className="trip-card-label">{p.title}</figcaption>
              </figure>
            ))}
          </div>

          <div className="trip-foot">
            <div className="trip-season">
              <p className="trip-when">
                <span>Season</span> {current.when}
              </p>
              <p className="trip-note">{current.note}</p>
            </div>
            <a
              href="#contacts"
              className="pill-btn is-ink is-large"
              onClick={(e) => {
                e.preventDefault();
                glideTo("contacts", 96);
              }}
            >
              Plan your trip
              <span className="pill-btn-icon">
                <ArrowIcon />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
