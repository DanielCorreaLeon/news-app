"use client";

import { motion } from "motion/react";

export function FeedSkeleton({ accentFrom }: { accentFrom: string }) {
  const tiles: Array<{ cls: string }> = [
    { cls: "md:col-span-2 md:row-span-2" },
    { cls: "md:col-span-2 md:row-span-1" },
    { cls: "md:col-span-1 md:row-span-1" },
    { cls: "md:col-span-1 md:row-span-1" },
    { cls: "md:col-span-1 md:row-span-2" },
    { cls: "md:col-span-2 md:row-span-1" },
    { cls: "md:col-span-1 md:row-span-1" },
  ];
  return (
    <div className="grid auto-rows-[200px] grid-cols-1 gap-4 md:grid-cols-4">
      {tiles.map((t, i) => (
        <motion.div
          key={i}
          className={`relative min-h-[220px] overflow-hidden rounded-3xl border border-border ${t.cls}`}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1 }}
          style={{
            background: `linear-gradient(135deg, color-mix(in oklch, ${accentFrom} 15%, var(--card)), var(--card))`,
          }}
        />
      ))}
    </div>
  );
}
