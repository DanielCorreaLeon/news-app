"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  href: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  gradient: string;
  icon: ReactNode;
  accent: string;
};

export function CategoryCard({
  href,
  title,
  subtitle,
  eyebrow,
  gradient,
  icon,
  accent,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative"
    >
      <Link
        href={href}
        className="relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-3xl p-8 md:p-10"
        style={{ background: gradient }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay">
          <div
            className="absolute -top-1/3 -left-1/3 h-[140%] w-[140%] rounded-full blur-3xl"
            style={{
              background: `radial-gradient(closest-side, ${accent}, transparent 70%)`,
            }}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2 text-xs font-medium tracking-widest text-white/90 uppercase">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {eyebrow}
          </div>
          <motion.div
            whileHover={{ rotate: -45 }}
            transition={{ duration: 0.4 }}
            className="rounded-full bg-white/15 p-3 backdrop-blur"
          >
            <ArrowUpRight className="size-5 text-white" strokeWidth={2.5} />
          </motion.div>
        </div>

        <div className="relative">
          <div className="mb-6 text-white/90">
            {icon}
          </div>
          <h2 className="font-display text-5xl font-bold tracking-tight text-white md:text-7xl">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-base text-white/80 text-pretty md:text-lg">
            {subtitle}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
