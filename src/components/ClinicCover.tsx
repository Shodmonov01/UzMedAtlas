"use client";

import { useState } from "react";

export function ClinicCover({
  src,
  alt,
  color,
  className,
}: {
  src?: string | null;
  alt: string;
  color: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={className} style={{ background: color }} aria-hidden="true" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
