"use client";

import type { MusicItem } from "@/lib/types";
import { NewsCard, type BentoSize } from "./news-card";

type Props = {
  items: MusicItem[];
  accentFrom: string;
};

const PATTERN: BentoSize[] = [
  "hero",
  "wide",
  "square",
  "square",
  "tall",
  "wide",
  "square",
  "banner",
  "hero",
  "wide",
  "square",
  "square",
  "tall",
  "wide",
];

export function BentoGrid({ items, accentFrom }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="grid auto-rows-[200px] grid-cols-1 gap-4 md:grid-cols-4">
      {items.map((item, i) => (
        <NewsCard
          key={item.id + i}
          item={item}
          size={PATTERN[i % PATTERN.length]}
          index={i}
          accentFrom={accentFrom}
        />
      ))}
    </div>
  );
}
