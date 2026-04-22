"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { MusicItem } from "@/lib/types";
import { ImageWithFallback } from "./image-with-fallback";

export type BentoSize = "hero" | "wide" | "tall" | "square" | "banner";

type Props = {
  item: MusicItem;
  size: BentoSize;
  index: number;
  accentFrom: string;
};

const SIZE_CLASS: Record<BentoSize, string> = {
  hero: "md:col-span-2 md:row-span-2",
  wide: "md:col-span-2 md:row-span-1",
  tall: "md:col-span-1 md:row-span-2",
  square: "md:col-span-1 md:row-span-1",
  banner: "md:col-span-4 md:row-span-1",
};

const SIZE_ASPECT: Record<BentoSize, string> = {
  hero: "aspect-square md:aspect-auto",
  wide: "aspect-[2/1]",
  tall: "aspect-[3/4] md:aspect-auto",
  square: "aspect-square",
  banner: "aspect-[3/1] md:aspect-[4/1]",
};

const SOURCE_LABEL: Record<MusicItem["source"], string> = {
  seed: "Tus artistas",
  similar: "Similar",
  listening: "Para ti hoy",
};

export function NewsCard({ item, size, index, accentFrom }: Props) {
  const title = item.title;
  const subtitle = item.artist;
  const meta = `${formatReleaseLabel(item.albumType)} · ${formatDate(item.releaseDate)}`;

  const titleSize =
    size === "hero"
      ? "text-3xl md:text-4xl lg:text-5xl"
      : size === "wide" || size === "banner"
        ? "text-2xl md:text-3xl"
        : size === "tall"
          ? "text-xl md:text-2xl"
          : "text-lg md:text-xl";

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className={`group relative block min-h-[220px] overflow-hidden rounded-3xl border border-border bg-card shadow-xl ${SIZE_CLASS[size]}`}
    >
      <div className={`absolute inset-0 ${SIZE_ASPECT[size]} md:h-full md:w-full`}>
        <ImageWithFallback
          src={item.image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          fallbackGradient={`linear-gradient(135deg, ${accentFrom}, oklch(0.18 0.1 280))`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      <div className="absolute top-4 left-4 flex items-center gap-1.5">
        <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase text-white/90 backdrop-blur">
          {SOURCE_LABEL[item.source]}
        </span>
        {item.matchedSeed && item.source === "seed" && (
          <span className="hidden rounded-full bg-white/15 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur md:inline">
            {item.matchedSeed}
          </span>
        )}
      </div>

      <div className="absolute top-4 right-4 rounded-full bg-black/40 p-2 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
        <ArrowUpRight className="size-4 text-white" />
      </div>

      <div className="relative flex h-full flex-col justify-end p-5 md:p-6">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-medium tracking-widest uppercase text-white/80">
          <span className="rounded-full bg-white/15 px-2 py-0.5 backdrop-blur">
            Spotify
          </span>
          <span>{meta}</span>
        </div>
        <h3
          className={`font-display font-bold leading-tight tracking-tight text-white text-balance ${titleSize}`}
        >
          {title}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-white/80 md:text-base">
          {subtitle}
        </p>
      </div>
    </motion.a>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 1000 / 60 / 60;
  if (diffH < 24) return "hoy";
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return "ayer";
  if (diffD < 7) return `hace ${diffD}d`;
  if (diffD < 30) return `hace ${Math.round(diffD / 7)}sem`;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

function formatReleaseLabel(kind: "single" | "album" | "compilation"): string {
  if (kind === "single") return "Single";
  if (kind === "album") return "Álbum";
  return "EP";
}
