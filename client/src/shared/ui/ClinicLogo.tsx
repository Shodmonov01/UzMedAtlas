import { useEffect, useState } from "react";

type Prepared = {
  /** The logo with its empty margins cut away (a data URL), or the original when there was nothing to cut. */
  src: string;
  ratio: number;
  /** The colour of the tile behind it: white, or the logo's own solid background so it reads as one piece. */
  background: string;
};

const prepared = new Map<string, Promise<Prepared>>();

/** Logos arrive in every shape: with wide white or transparent margins, off-centre, on a coloured square.
 *  Look at the pixels once (per URL, per visit) and cut the logo down to what is actually drawn,
 *  so every tile shows it whole, centred and at the same visual size. */
function prepareLogo(url: string): Promise<Prepared> {
  let job = prepared.get(url);
  if (!job) {
    job = load(url).then(trim, () => ({ src: url, ratio: 1, background: "#fff" }));
    prepared.set(url, job);
  }
  return job;
}

function load(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (new URL(url, location.href).origin !== location.origin) img.crossOrigin = "anonymous";
    img.onload = () => (img.naturalWidth ? resolve(img) : reject());
    img.onerror = reject;
    img.src = url;
  });
}

function trim(img: HTMLImageElement): Prepared {
  const natural = img.naturalWidth / img.naturalHeight;
  const original: Prepared = { src: img.src, ratio: natural, background: "#fff" };
  try {
    const scale = Math.min(1, 320 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const px = (x: number, y: number) => data.subarray((y * w + x) * 4, (y * w + x) * 4 + 4);

    const corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
    const transparent = corners.every((c) => c[3] < 24);
    const bg = transparent ? null : corners[0];
    // A photo-like logo: nothing safe to cut, show it as is.
    if (bg && !corners.every((c) => c[3] > 230 && distance(c, bg) < 36)) return original;
    // A logo on its own coloured square: cut the margins too, and paint the tile in that colour.
    const background = !bg || Math.min(bg[0], bg[1], bg[2]) > 240 ? "#fff" : `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`;

    let top = h, left = w, right = -1, bottom = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = px(x, y);
        const ink = transparent ? c[3] > 24 : c[3] > 24 && distance(c, bg!) > 30;
        if (!ink) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
    if (right < 0) return { ...original, background };

    const boxW = right - left + 1;
    const boxH = bottom - top + 1;
    if (boxW / w > 0.97 && boxH / h > 0.97) return { ...original, background };

    // Back to full resolution, with a hair of breathing room so anti-aliased edges survive.
    const pad = Math.round(Math.max(boxW, boxH) * 0.02);
    const sx = Math.max(0, (left - pad) / scale);
    const sy = Math.max(0, (top - pad) / scale);
    const sw = Math.min(img.naturalWidth - sx, (boxW + pad * 2) / scale);
    const sh = Math.min(img.naturalHeight - sy, (boxH + pad * 2) / scale);
    const out = document.createElement("canvas");
    const outScale = Math.min(1, 512 / Math.max(sw, sh));
    out.width = Math.max(1, Math.round(sw * outScale));
    out.height = Math.max(1, Math.round(sh * outScale));
    out.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
    return { src: out.toDataURL("image/png"), ratio: sw / sh, background };
  } catch {
    // A cross-origin logo without CORS headers cannot be read; show it untouched.
    return original;
  }
}

function distance(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

type Props = {
  src?: string | null;
  name: string;
  /** Size and corner radius of the tile, e.g. "h-16 w-16 rounded-2xl". With `wide`, give only the height. */
  className?: string;
  /** Let the tile grow sideways (up to 2:1) for wide wordmarks instead of shrinking them inside a square. */
  wide?: boolean;
};

/** A clinic's logo on a tile: never cropped or stretched, always centred, the same visual weight in every place.
 *  Without a logo, the clinic's initial on the brand gradient. */
export function ClinicLogo({ src, name, className = "", wide = false }: Props) {
  const [logo, setLogo] = useState<Prepared | null>(null);

  useEffect(() => {
    setLogo(null);
    if (!src) return;
    let alive = true;
    prepareLogo(src).then((result) => alive && setLogo(result));
    return () => {
      alive = false;
    };
  }, [src]);

  if (!src) {
    return (
      <span className={`clinic-logo is-empty ${className}`} aria-hidden="true">
        {name.trim().slice(0, 1).toUpperCase()}
      </span>
    );
  }

  const ratio = logo?.ratio ?? 1;
  return (
    <span
      className={`clinic-logo ${ratio > 1.15 ? "is-landscape" : ratio < 0.87 ? "is-portrait" : ""} ${className}`}
      style={{
        background: logo?.background,
        aspectRatio: wide ? String(Math.min(2, Math.max(1, ratio))) : undefined,
      }}
    >
      <img src={logo?.src ?? src} alt={name} decoding="async" draggable={false} />
    </span>
  );
}
