import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { useLang } from "@/shared/i18n/lang";
import { FitImage } from "@/shared/ui/FitImage";

export type GalleryPhoto = {
  id: string;
  url: string;
  alt?: string;
};

type Props = {
  photos: GalleryPhoto[];
  className?: string;
};

export function PhotoCarousel({ photos, className = "" }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-photo-card]");
    const step = card ? card.offsetWidth + 12 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!photos.length) return null;

  return (
    <>
      <div className={`relative min-w-0 max-w-full ${className}`}>
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-lg font-bold text-ink shadow-md hover:bg-white sm:grid"
              onClick={() => scrollByCard(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-lg font-bold text-ink shadow-md hover:bg-white sm:grid"
              onClick={() => scrollByCard(1)}
            >
              ›
            </button>
          </>
        ) : null}

        <div
          ref={scrollerRef}
          className="flex max-w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              data-photo-card
              className="group relative w-[min(100%,280px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-sand text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-[min(48%,300px)] md:w-[calc((100%-1.5rem)/3)]"
              onClick={() => setLightboxIndex(index)}
            >
              <FitImage
                src={photo.url}
                alt={photo.alt || ""}
                className="aspect-[3/2] w-full transition duration-500 group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>

        {photos.length > 1 ? (
          <p className="mt-2 text-xs text-muted">{photos.length} photos</p>
        ) : null}
      </div>

      <PhotoLightbox photos={photos} index={lightboxIndex} onIndexChange={setLightboxIndex} />
    </>
  );
}


/** Full-screen viewer for a set of photos, in the manner of the phone's own photo app: swipe sideways between the
 *  pictures (scroll-snap, so it follows the finger), the counter and the close button sit right above the picture,
 *  a strip of thumbnails below jumps to any of them. On wide screens arrows sit beside the picture; the arrow keys
 *  and Escape work too. A tap on the dark space around the picture closes it. */
export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
}: {
  photos: GalleryPhoto[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const { t } = useLang();
  const open = index != null && photos.length > 0;
  const track = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  // Width-to-height of each picture once loaded: the stage takes the current picture's height, so the bar with the
  // close button sits right on top of the picture and the thumbnails right under it.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const latest = useRef({ index, onIndexChange, count: photos.length });
  latest.current = { index, onIndexChange, count: photos.length };

  const close = () => latest.current.onIndexChange(null);
  const step = (dir: -1 | 1) => {
    const { index: i, count } = latest.current;
    if (i == null || !count) return;
    const next = i + dir;
    if (next >= 0 && next < count) latest.current.onIndexChange(next);
  };

  // Lock the page, listen to the keys.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    const html = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    html.classList.add("has-lightbox");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      html.classList.remove("has-lightbox");
      window.removeEventListener("keydown", onKey);
      placed.current = false;
    };
  }, [open]);

  // Bring the current picture into place: at once when the viewer opens, gliding after a tap on an arrow or a thumb.
  useEffect(() => {
    const el = track.current;
    if (!el || index == null) return;
    const left = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) > 2) el.scrollTo({ left, behavior: placed.current ? "smooth" : "instant" });
    placed.current = true;
    const thumb = thumbs.current?.children[index] as HTMLElement | undefined;
    if (thumb && thumbs.current) {
      thumbs.current.scrollTo({ left: thumb.offsetLeft - thumbs.current.clientWidth / 2 + thumb.offsetWidth / 2, behavior: "smooth" });
    }
  }, [index, open]);

  // After a swipe settles, the picture in view becomes the current one.
  useEffect(() => {
    const el = track.current;
    if (!el || !open) return;
    let timer = 0;
    const settle = () => {
      const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      if (i !== latest.current.index && i >= 0 && i < latest.current.count) latest.current.onIndexChange(i);
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 90);
    };
    // Keep the picture in place when the phone turns or the window resizes.
    const onResize = () => {
      const i = latest.current.index ?? 0;
      el.scrollTo({ left: i * el.clientWidth, behavior: "instant" });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  if (!open || index == null) return null;
  const active = photos[index];
  const many = photos.length > 1;
  const ratio = ratios[active.id] || 4 / 3;

  return createPortal(
    <div className="lightbox" style={{ "--lightbox-ratio": ratio } as CSSProperties} role="dialog" aria-modal="true" aria-label={t({ ru: "Просмотр фотографий", uz: "Rasmlarni koʻrish", en: "Photo viewer" })}>
      <div className="lightbox-bar">
        <span className="lightbox-count">
          {index + 1} / {photos.length}
        </span>
        <button type="button" className="lightbox-close" aria-label={t({ ru: "Закрыть", uz: "Yopish", en: "Close" })} onClick={close}>
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className="lightbox-stage">
        <div ref={track} className="lightbox-track">
          {photos.map((photo, i) => (
            <div key={photo.id} className="lightbox-slide" onClick={(e) => e.target === e.currentTarget && close()}>
              {Math.abs(i - index) <= 2 ? (
                <img
                  src={photo.url}
                  alt={photo.alt || ""}
                  draggable={false}
                  loading={i === index ? "eager" : "lazy"}
                  onLoad={(e) => {
                    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                    if (w && h) setRatios((prev) => (prev[photo.id] ? prev : { ...prev, [photo.id]: w / h }));
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>
        {many ? (
          <>
            <button type="button" className="lightbox-arrow is-prev" aria-label={t({ ru: "Предыдущее", uz: "Oldingi", en: "Previous" })} disabled={index === 0} onClick={() => step(-1)}>
              <CaretLeft size={22} weight="bold" />
            </button>
            <button
              type="button"
              className="lightbox-arrow is-next"
              aria-label={t({ ru: "Следующее", uz: "Keyingi", en: "Next" })}
              disabled={index === photos.length - 1}
              onClick={() => step(1)}
            >
              <CaretRight size={22} weight="bold" />
            </button>
          </>
        ) : null}
      </div>

      {active.alt ? <p className="lightbox-caption">{active.alt}</p> : null}

      {many ? (
        <div ref={thumbs} className="lightbox-thumbs">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              className={i === index ? "is-active" : undefined}
              aria-label={`${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => onIndexChange(i)}
            >
              <img src={photo.url} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
