"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useMusicPrefs } from "@/lib/preferences";
import type { MusicItem } from "@/lib/types";

type Cover = { image: string; artist: string; title: string };

type Props = {
  name: string;
  fallbackCovers: Cover[];
};

export function PersonalPanel({ name, fallbackCovers }: Props) {
  const prefs = useMusicPrefs();
  const [personal, setPersonal] = useState<MusicItem[] | null>(null);
  const seeds = prefs.likedArtists;
  const seedKey = seeds.join(",");

  useEffect(() => {
    if (seeds.length === 0) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      artists: seeds.slice(0, 3).join(","),
    });
    fetch(`/api/news/music?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { items?: MusicItem[] }) => {
        if (controller.signal.aborted) return;
        const withImage = (d.items ?? []).filter((i) => i.image);
        setPersonal(withImage.slice(0, 4));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [seeds.length, seedKey]);

  const personalForRender = seeds.length === 0 ? null : personal;
  const mosaicSource: Cover[] =
    personalForRender && personalForRender.length > 0
      ? personalForRender.map((p) => ({
          image: p.image ?? "",
          artist: p.artist,
          title: p.title,
        }))
      : fallbackCovers.slice(0, 4);

  const mosaic = mosaicSource.filter((c) => c.image).slice(0, 4);
  const hasSeeds = seeds.length > 0;
  const eyebrow = hasSeeds ? "Tu perfil" : "Descubrí lanzamientos";
  const subtitle = hasSeeds
    ? seeds.slice(0, 4).join(" · ") +
      (seeds.length > 4 ? ` · +${seeds.length - 4}` : "")
    : "Configura tus artistas";
  const ctaLabel = hasSeeds ? "Ir a mi feed" : "Empezar";
  const ctaHref = hasSeeds ? "/feed" : "/setup";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      whileHover={{ y: -4 }}
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl"
    >
      {mosaic.length >= 4 ? (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          {mosaic.map((c, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={c.image + i}
              src={c.image}
              alt={`${c.artist} — ${c.title}`}
              className="h-full w-full object-cover"
            />
          ))}
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.3 0.15 240) 0%, oklch(0.2 0.12 220) 100%)",
          }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-transparent" />

      <Link
        href={ctaHref}
        className="relative flex h-full flex-col justify-between p-8 md:p-10"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-white/90">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-white" />
            {eyebrow}
          </div>
          <div className="rounded-full bg-white/15 p-3 backdrop-blur transition-transform group-hover:rotate-[-45deg]">
            <ArrowUpRight className="size-5 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium tracking-wide text-white/80">
            Hola,
          </p>
          <h2 className="font-display text-5xl font-bold leading-none tracking-tight text-white md:text-6xl">
            {name}
          </h2>
          {hasSeeds && (
            <div className="mt-4 mb-5 flex flex-wrap gap-1.5">
              {seeds.slice(0, 6).map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/90 backdrop-blur"
                >
                  {s}
                </span>
              ))}
              {seeds.length > 6 && (
                <span className="rounded-full border border-dashed border-white/20 px-2.5 py-1 text-xs text-white/60">
                  +{seeds.length - 6}
                </span>
              )}
            </div>
          )}
          {!hasSeeds && (
            <p className="mt-3 mb-5 max-w-xs text-sm text-white/70">{subtitle}</p>
          )}
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-white transition-transform group-hover:translate-x-0.5">
            {ctaLabel} <ArrowUpRight className="size-3.5" />
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
