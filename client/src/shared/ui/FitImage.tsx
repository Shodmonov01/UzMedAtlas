import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt?: string;
  className?: string;
  /** How much of the photo may be cropped away (0.12 = 12% of one side) before it is shown whole instead. */
  tolerance?: number;
  loading?: "lazy" | "eager";
};

/** A photo that fills its frame without losing what matters, whatever shape it was uploaded in.
 *  When the photo's proportions are close to the frame's it covers the frame (a small, centred crop);
 *  when they are far apart it is shown whole, over a blurred copy of itself that fills the rest.
 *  The frame's size comes from `className` (an aspect ratio, a height, or `absolute inset-0`). */
export function FitImage({ src, alt = "", className = "", tolerance = 0.12, loading = "lazy" }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<number | null>(null);
  const [frame, setFrame] = useState<number | null>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setFrame(width / height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    setNatural(img?.complete && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null);
  }, [src]);

  const contained =
    natural != null && frame != null && 1 - Math.min(natural, frame) / Math.max(natural, frame) > tolerance;

  return (
    <div ref={frameRef} className={`fit-image ${contained ? "is-contained" : ""} ${className}`}>
      {contained ? <img src={src} alt="" aria-hidden="true" className="fit-image-backdrop" /> : null}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className="fit-image-main"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) setNatural(img.naturalWidth / img.naturalHeight);
        }}
      />
    </div>
  );
}
