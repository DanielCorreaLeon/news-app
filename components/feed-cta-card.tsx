"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Disc3 } from "lucide-react";

export function FeedCtaCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link
        href="/setup"
        className="relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-3xl p-8 md:p-10"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.35 0.2 330) 0%, oklch(0.25 0.2 300) 55%, oklch(0.18 0.15 275) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-1/3 -left-1/3 h-[150%] w-[140%] opacity-60 mix-blend-overlay"
          style={{
            background:
              "radial-gradient(closest-side, oklch(0.8 0.25 330), transparent 65%)",
          }}
        />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-white/90">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-white" />
            Empezar
          </div>
          <div className="rounded-full bg-white/15 p-3 backdrop-blur transition-transform group-hover:rotate-[-45deg]">
            <ArrowUpRight className="size-5 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div className="relative">
          <Disc3
            className="mb-6 size-14 text-white/90"
            strokeWidth={1.2}
          />
          <h2 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-white md:text-6xl">
            Armar mi feed
          </h2>
          <p className="mt-3 max-w-xs text-sm text-white/80 md:text-base">
            Elige tus artistas favoritos y cuéntanos qué escuchas. Te armamos un
            feed visual con lo nuevo.
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
