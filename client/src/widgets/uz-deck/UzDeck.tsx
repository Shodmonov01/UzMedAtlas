import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { LogoTiles } from "@/shared/ui/LogoTiles";
import { Reveal } from "@/shared/ui/Reveal";

type Photo = { src: string; title: string; srcSet?: string; width?: number; height?: number };

/** Photos of the country deck, each titled after a phrase of the statement. */
const COUNTRY_PHOTOS: Photo[] = [
  { src: "uzbekistan/uz-mountains", title: "Величественные горы" },
  { src: "uzbekistan/uz-mosque", title: "Богатая культура" },
  { src: "uzbekistan/uz-registan", title: "Самарканд · Регистан" },
  { src: "uzbekistan/uz-khiva", title: "Древняя история" },
  { src: "uzbekistan/uz-dome", title: "Искусство мастеров" },
  { src: "uzbekistan/uz-tashkent", title: "Современное развитие" },
  { src: "uzbekistan/uz-travellers", title: "Путешественники со всего мира" },
].map((photo) => ({ ...photo, srcSet: `/images/${photo.src}-800.webp 800w, /images/${photo.src}.webp 1460w`, width: 1460, height: 816 }));

/** Frames from the tourism film for the medical tourism deck (852×478 masters). */
const MED_PHOTOS: Photo[] = [
  { src: "medtourism/med-therapy", title: "Высокотехнологичное лечение" },
  { src: "medtourism/med-surgeons", title: "Опытные хирурги" },
  { src: "medtourism/med-robot", title: "Роботизированная хирургия" },
  { src: "medtourism/med-mri", title: "Современная диагностика" },
  { src: "medtourism/med-reception", title: "Комфортные палаты" },
  { src: "medtourism/med-rehab", title: "Реабилитация" },
  { src: "medtourism/med-sanatorium", title: "Санатории и отдых" },
  { src: "medtourism/med-consult", title: "Сопровождение пациентов" },
].map((photo) => ({ ...photo, width: 852, height: 478 }));

export function UzDeck() {
  return (
    <PhotoWheel
      id="country"
      eyebrow="Наша страна"
      photos={COUNTRY_PHOTOS}
      tiles={[["tl", 3], ["br", 7]]}
      title={<><em>Узбекистан</em> — край, где гармонично сочетаются древняя история, богатая культура и современное развитие.</>}
      text="Расположенная в самом сердце Великого шёлкового пути, эта страна покоряет путешественников со всего мира жемчужинами Самарканда, Бухары и Хивы, величественными горами и неповторимой природой."
    />
  );
}

export function MedDeck() {
  return (
    <PhotoWheel
      id="medtourism"
      eyebrow="Медицинский туризм"
      photos={MED_PHOTOS}
      tiles={[["tr", 13], ["bl", 17]]}
      mirrored
      title={<><em>Лечение в Узбекистане</em> — современная медицина рядом с древними городами.</>}
      text="Клиники с новым оборудованием и опытными врачами принимают пациентов из разных стран: диагностика, операции и реабилитация по понятным ценам, а восстановиться можно в санаториях среди гор."
    />
  );
}

type WheelProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  text: string;
  photos: Photo[];
  tiles: [corner: "tl" | "tr" | "bl" | "br", seed: number][];
  /** Wheel on the left, statement on the right. */
  mirrored?: boolean;
};

/** A statement beside photo cards riding a wheel (the country deck after the hero, the medical tourism deck).
 *  While the stage is pinned the scroll turns the wheel once around: each card swings in from below, rests in front
 *  and swings out above. Whenever the scroll rests, the wheel keeps turning on its own, endlessly.
 *  Phones and tablets get a swipeable row of cards instead, nudged on to the next card every few seconds.
 *  Reduced motion: the statement and the first card, without the pinned stage. */
function PhotoWheel({ id, eyebrow, title, text, photos, tiles, mirrored = false }: WheelProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current!;
    const cards = [...section.querySelectorAll<HTMLElement>(".uz-card")];
    const count = section.querySelector<HTMLElement>(".uz-count-current")!;
    const caption = section.querySelector<HTMLElement>(".uz-count-title")!;
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const narrow = window.matchMedia("(max-width: 899px)");
    const deck = section.querySelector<HTMLElement>(".uz-deck")!;
    const n = cards.length;
    let raf = 0;
    let read = 0;
    // Cards dealt by themselves, and when the page last scrolled.
    let auto = 0;
    let autoTarget = 0;
    let lastScroll = 0;

    const showCard = (front: number) => {
      count.textContent = String(front + 1).padStart(2, "0");
      caption.textContent = photos[front].title;
    };
    // Narrow screens: the card nearest the middle of the row is the current one.
    const frontOfRow = () => {
      const middle = deck.scrollLeft + deck.clientWidth / 2;
      let best = 0;
      cards.forEach((card, i) => {
        const centre = card.offsetLeft + card.offsetWidth / 2;
        if (Math.abs(centre - middle) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - middle)) best = i;
      });
      return best;
    };
    let lastSwipe = 0;
    const onDeckScroll = () => {
      if (narrow.matches) showCard(frontOfRow());
    };
    const onTouch = () => {
      lastSwipe = performance.now();
    };

    const update = () => {
      raf = 0;
      if (narrow.matches) return;
      const scrollable = section.offsetHeight - window.innerHeight;
      const readTarget = query.matches && scrollable > 0 ? span(-section.getBoundingClientRect().top / scrollable, 0, 1) : 0;
      read = approach(read, readTarget, 0.14);
      auto = approach(auto, autoTarget, 0.07);
      if (read !== readTarget || auto !== autoTarget) schedule();

      // The scroll turns the wheel once around, resting a moment on each card; the auto steps add on top.
      const turned = span(read, 0.04, 0.92) * (n - 1);
      const turn = Math.floor(turned) + ease(turned - Math.floor(turned)) + auto;
      cards.forEach((card, i) => {
        // Steps from the front (-1 below, 0 front, 1 above), wrapped into -n/2..n/2 so the ring is endless;
        // the wrap happens out of sight.
        const away = ((((turn - i) % n) + n + n / 2) % n) - n / 2;
        card.style.setProperty("--d", away.toFixed(4));
        card.style.setProperty("--s", (1 - Math.min(1, Math.abs(away)) * 0.12).toFixed(4));
        card.style.opacity = String(Math.max(0, 1 - Math.abs(away) * 0.55));
        card.style.zIndex = String(10 - Math.round(Math.abs(away) * 2));
      });
      showCard(((Math.round(turn) % n) + n) % n);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onScroll = () => {
      lastScroll = performance.now();
      schedule();
    };
    // While the deck is on screen and the scroll rests, it deals one card every few seconds.
    const tick = window.setInterval(() => {
      const box = section.getBoundingClientRect();
      const onScreen = box.top < window.innerHeight / 2 && box.bottom > window.innerHeight / 2;
      if (!query.matches || !onScreen || document.hidden) return;
      if (narrow.matches) {
        // Leave the row alone for a while after the reader swipes it.
        if (performance.now() - lastSwipe < 5000) return;
        const next = cards[(frontOfRow() + 1) % n];
        deck.scrollTo({ left: next.offsetLeft - (deck.clientWidth - next.offsetWidth) / 2, behavior: "smooth" });
      } else if (performance.now() - lastScroll > 1500) {
        autoTarget += 1;
        schedule();
      }
    }, 3200);

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    query.addEventListener("change", schedule);
    narrow.addEventListener("change", schedule);
    deck.addEventListener("scroll", onDeckScroll, { passive: true });
    deck.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(tick);
      narrow.removeEventListener("change", schedule);
      deck.removeEventListener("scroll", onDeckScroll);
      deck.removeEventListener("touchstart", onTouch);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      query.removeEventListener("change", schedule);
    };
  }, [photos]);

  return (
    <section ref={sectionRef} id={id} className={`uz${mirrored ? " is-mirrored" : ""}`}>
      <div className="uz-stage">
        {tiles.map(([corner, seed]) => (
          <LogoTiles key={corner} corner={corner} seed={seed} />
        ))}
        <Reveal className="uz-copy">
          <p className="uz-eyebrow">{eyebrow}</p>
          <h2 className="uz-title">{title}</h2>
          <p className="uz-text">{text}</p>
          <p className="uz-count" aria-hidden="true">
            <span className="uz-count-current">01</span>
            <span className="uz-count-total"> / {String(photos.length).padStart(2, "0")}</span>
            <span className="uz-count-title">{photos[0].title}</span>
          </p>
        </Reveal>

        <div className="uz-deck">
          {photos.map((photo, i) => (
            <figure key={photo.src} className="uz-card" style={{ "--d": -i, opacity: i ? 0 : 1 } as CSSProperties}>
              <img
                src={`/images/${photo.src}.webp`}
                srcSet={photo.srcSet}
                sizes={photo.srcSet ? "(max-width: 899px) 90vw, 50vw" : undefined}
                alt={photo.title}
                width={photo.width}
                height={photo.height}
                decoding="async"
              />
              <figcaption>{photo.title}</figcaption>
            </figure>
          ))}
        </div>
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

/** One smoothing step toward `target`; snaps when close enough. */
function approach(value: number, target: number, rate: number) {
  const next = value + (target - value) * rate;
  return Math.abs(target - next) < 0.0005 ? target : next;
}
