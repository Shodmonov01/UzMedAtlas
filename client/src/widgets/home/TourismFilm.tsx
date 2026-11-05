import { useRef } from "react";
import { MOTION_OK, SplitText, gsap, useGSAP } from "@/shared/lib/gsap";
import { useAmbientFilm } from "@/shared/lib/use-ambient-film";
import { SoundToggle } from "@/shared/ui/SoundToggle";
import { useLang } from "@/shared/i18n/lang";

/** Treatment and rest in one trip: the country film (horizons, mountains, valleys) over the whole screen at full
 *  size (no scroll effect on the film itself); the heading rises line by line as it comes into view, the sound
 *  button sits in the bottom right corner on the heading's baseline. The film loads and plays only near the screen.
 *  With reduced motion: its poster. */
export function TourismFilm() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useLang();
  const { sound, toggleSound } = useAmbientFilm(videoRef, {
    desktop: "/videos/medtour/medtour-1080.mp4",
    mobile: "/videos/medtour/medtour-mobile.mp4",
  });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        SplitText.create(".film-title", {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.3,
              stagger: 0.1,
              ease: "expo.out",
              scrollTrigger: { trigger: root.current, start: "top 45%", once: true },
            }),
        });
        gsap.from(".film-text", {
          y: 24,
          autoAlpha: 0,
          duration: 1.1,
          delay: 0.3,
          scrollTrigger: { trigger: root.current, start: "top 45%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="film" aria-labelledby="film-title">
      <div className="film-frame">
        <video ref={videoRef} className="film-video" poster="/videos/medtour/medtour-poster.jpg" muted loop playsInline preload="none" aria-hidden="true" />
        <span className="film-shade" />
        <div className="film-copy">
          <h2 id="film-title" className="film-title">
            {t({ ru: "Лечение и отдых в\u00a0одной поездке", uz: "Davolanish va dam olish bitta safarda", en: "Treatment and rest in\u00a0one trip" })}
          </h2>
          <p className="film-text">
            {t({
              ru: "Горный воздух, тёплое солнце и бескрайние долины. Здесь легко восстанавливаться после лечения.",
              uz: "Togʻ havosi, iliq quyosh va cheksiz vodiylar. Bu yerda davolanishdan keyin tiklanish oson.",
              en: "Mountain air, warm sun and endless valleys. Here it is easy to recover after treatment.",
            })}
          </p>
        </div>
        <SoundToggle on={sound} onToggle={toggleSound} className="film-sound" />
      </div>
    </section>
  );
}
