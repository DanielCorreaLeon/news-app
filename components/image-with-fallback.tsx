"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  className?: string;
  fallbackGradient?: string;
};

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackGradient,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={className}
        style={{
          background:
            fallbackGradient ??
            "linear-gradient(135deg, oklch(0.3 0.15 310), oklch(0.2 0.15 260))",
        }}
        aria-label={alt}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
