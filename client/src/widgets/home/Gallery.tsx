import { useRef, useState } from "react";
import { MOTION_OK, SplitText, gsap, useGSAP } from "@/shared/lib/gsap";
import { PhotoLightbox, type GalleryPhoto } from "@/shared/ui/PhotoCarousel";

type Place = { photo: string; place: string; city: string; alt: string };

const PLACES: Place[] = [
  { photo: "story-1", place: "Registan at dusk", city: "Samarkand", alt: "Registan Square in Samarkand lit up under a violet evening sky" },
  { photo: "story-2", place: "Itchan Kala", city: "Khiva", alt: "The clay gate and towers of the Itchan Kala walls in Khiva" },
  { photo: "story-3", place: "Shah-i-Zinda", city: "Samarkand", alt: "The blue-domed mausoleums of Shah-i-Zinda in Samarkand at sunset" },
  { photo: "story-4", place: "Folk dance", city: "Uzbekistan", alt: "Dancers in bright national dress in front of a tiled portal" },
  { photo: "story-5", place: "Kalta Minor at dusk", city: "Khiva", alt: "The old town of Khiva with the Kalta Minor minaret at dusk" },
  { photo: "story-6", place: "Sher-Dor Madrasa", city: "Samarkand", alt: "Sher-Dor Madrasa on Registan seen through a tiled arch" },
  { photo: "story-7", place: "Ceramics", city: "Uzbekistan", alt: "Painted blue ceramic jugs and a brass ewer" },
  { photo: "story-8", place: "Gur-e-Amir", city: "Samarkand", alt: "The Gur-e-Amir mausoleum lit up at night" },
  { photo: "story-9", place: "Islam Khodja Minaret", city: "Khiva", alt: "A tiled minaret over the roofs of Khiva at sunset" },
  { photo: "story-10", place: "Bibi-Khanym Mosque", city: "Samarkand", alt: "The Bibi-Khanym Mosque behind the domes of Shah-i-Zinda" },
  { photo: "story-11", place: "Painted ceilings", city: "Uzbekistan", alt: "A painted wooden ceiling over a row of clay jugs" },
  { photo: "story-12", place: "Domes of Shah-i-Zinda", city: "Samarkand", alt: "Two domes of Shah-i-Zinda framed by a brick arch" },
  { photo: "story-13", place: "Gilded domes", city: "Samarkand", alt: "A gilded dome seen from below, its honeycomb vaults shining" },
  { photo: "story-14", place: "Registan domes", city: "Samarkand", alt: "A turquoise dome between the tiled walls of Registan" },
];
const ROWS = [PLACES.filter((_, i) => i % 2 === 0), PLACES.filter((_, i) => i % 2 === 1)];
// The same photos for the full-screen viewer, captioned "place · city".
const VIEWER: GalleryPhoto[] = PLACES.map((p) => ({ id: p.photo, url: `/images/discover/${p.photo}.webp`, alt: `${p.place} · ${p.city}` }));

/** Uzbekistan in photos: the label, the heading and one line on top, then two full-width rows of rounded photos.
 *  As the page scrolls through the section, both rows glide in from the left and out to the right, the lower one a
 *  little slower, so the photos keep sliding past. A photo opens full screen on a click, to stop and look at it (and
 *  swipe through the rest). With reduced motion the rows stand still and can be swiped. */
export function Gallery() {
  const root = useRef<HTMLElement>(null);
  const [viewing, setViewing] = useState<number | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        SplitText.create(".story-title", {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.3,
              stagger: 0.1,
              ease: "expo.out",
              scrollTrigger: { trigger: ".story-head", start: "top 80%", once: true },
            }),
        });
        gsap.from([".story-chip", ".story-lead"], {
          y: 20,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.08,
          delay: 0.2,
          scrollTrigger: { trigger: ".story-head", start: "top 80%", once: true },
        });

        // Each row starts shifted left by most of what it overflows and ends shifted right of where it began,
        // so the photos come in from the left and leave to the right while the section crosses the screen.
        gsap.utils.toArray<HTMLElement>(".story-track").forEach((track, i) => {
          const travel = () => Math.max(track.scrollWidth - window.innerWidth, 0) + window.innerWidth * 0.25;
          gsap.fromTo(
            track,
            { x: () => -travel() },
            {
              x: () => (i === 0 ? 0 : -travel() * 0.35),
              ease: "none",
              scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="story" aria-labelledby="story-title">
      <div className="wrap story-head">
        <div>
          <p className="story-chip">Our country</p>
          <h2 id="story-title" className="story-title">
            Uzbekistan <em>in photos</em>
          </h2>
        </div>
        <p className="story-lead">Blue domes, clay walls, crafts and dances, a short way from the clinics.</p>
      </div>

      <div className="story-rows">
        {ROWS.map((row, r) => (
          <ul key={r} className="story-track">
            {row.map((p) => (
              <li key={p.photo} className="story-card">
                <button type="button" className="story-card-open" aria-label={`Open the photo: ${p.place}, ${p.city}`} onClick={() => setViewing(PLACES.indexOf(p))}>
                <img
                  src={`/images/discover/${p.photo}-1000.webp`}
                  srcSet={`/images/discover/${p.photo}-1000.webp 1000w, /images/discover/${p.photo}.webp 1284w`}
                  sizes="(max-width: 767px) 82vw, 38vw"
                  alt={p.alt}
                  loading="lazy"
                  decoding="async"
                />
                <span className="story-card-label">
                  <img src="/brand/logo.svg" alt="" width={18} height={18} />
                  <strong>{p.place}</strong>
                  <span>· {p.city}</span>
                </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <PhotoLightbox photos={VIEWER} index={viewing} onIndexChange={setViewing} />
    </section>
  );
}
