import { useEffect, useState } from "react";
import { Reveal } from "@/shared/ui/Reveal";

export type Slide = { src: string; alt: string; position?: string };

const INTERVAL = 3000;

/** Photos that cross-fade every three seconds; hovering or focusing the frame holds the current one. */
export function PhotoSlides({ photos, className = "" }: { photos: Slide[]; className?: string }) {
  const [current, setCurrent] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held) return;
    const timer = window.setTimeout(() => setCurrent((i) => (i + 1) % photos.length), INTERVAL);
    return () => window.clearTimeout(timer);
  }, [current, held, photos.length]);

  return (
    <Reveal
      className={className}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <div className="photo-slides">
        {photos.map((photo, i) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            aria-hidden={i !== current}
            decoding="async"
            className={i === current ? "is-active" : undefined}
            style={{ objectPosition: photo.position }}
          />
        ))}
      </div>
      <div className="photo-slides-dots">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            className={i === current ? "is-active" : undefined}
            onClick={() => setCurrent(i)}
            aria-label={`Фото ${i + 1} из ${photos.length}`}
            aria-current={i === current}
          />
        ))}
      </div>
    </Reveal>
  );
}
