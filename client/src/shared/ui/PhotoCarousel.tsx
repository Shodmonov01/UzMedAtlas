import { useEffect, useRef, useState } from "react";
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
              aria-label="Предыдущее фото"
              className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-lg font-bold text-ink shadow-md hover:bg-white sm:grid"
              onClick={() => scrollByCard(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Следующее фото"
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
          <p className="mt-2 text-xs text-muted">{photos.length} фото</p>
        ) : null}
      </div>

      <PhotoLightbox photos={photos} index={lightboxIndex} onIndexChange={setLightboxIndex} />
    </>
  );
}

/** Full-screen viewer for a set of photos: arrows and keys step through them, Escape or a click outside closes it. */
export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
}: {
  photos: GalleryPhoto[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const open = index != null && photos.length > 0;
  const closeLightbox = () => onIndexChange(null);
  const stepLightbox = (dir: -1 | 1) => {
    if (index != null && photos.length) onIndexChange((index + dir + photos.length) % photos.length);
  };
  const latest = useRef({ closeLightbox, stepLightbox });
  latest.current = { closeLightbox, stepLightbox };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") latest.current.closeLightbox();
      if (e.key === "ArrowLeft") latest.current.stepLightbox(-1);
      if (e.key === "ArrowRight") latest.current.stepLightbox(1);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (index == null || !open) return null;
  const active = photos[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фотографии"
      onClick={closeLightbox}
    >
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-xl font-bold text-white hover:bg-white/25"
        onClick={closeLightbox}
      >
        ×
      </button>

      {photos.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Предыдущее"
            className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl font-bold text-white hover:bg-white/25 md:left-6"
            onClick={(e) => {
              e.stopPropagation();
              stepLightbox(-1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Следующее"
            className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl font-bold text-white hover:bg-white/25 md:right-6"
            onClick={(e) => {
              e.stopPropagation();
              stepLightbox(1);
            }}
          >
            ›
          </button>
        </>
      ) : null}

      <figure
        className="relative max-h-[85vh] max-w-[min(960px,92vw)]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={active.url}
          alt={active.alt || ""}
          className="max-h-[85vh] w-full rounded-2xl object-contain shadow-2xl"
        />
        <figcaption className="mt-3 text-center text-sm text-white/80">
          {index + 1} / {photos.length}
          {active.alt ? ` · ${active.alt}` : ""}
        </figcaption>
      </figure>
    </div>
  );
}
