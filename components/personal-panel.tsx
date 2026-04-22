"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowRight, Music2 } from "lucide-react";
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
    const params = new URLSearchParams({ artists: seedKey });
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

  const hasSeeds = seeds.length > 0;
  const mosaicSource: Cover[] =
    personalForRender && personalForRender.length > 0
      ? personalForRender.map((p) => ({
          image: p.image ?? "",
          artist: p.artist,
          title: p.title,
        }))
      : fallbackCovers.slice(0, 4).map((c) => ({ ...c }));

  const mosaic = mosaicSource.filter((c) => c.image).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass relative overflow-hidden rounded-3xl border border-border p-6 md:p-7"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--music-from)] to-[var(--music-to)] text-white shadow-lg">
          <Music2 className="size-5" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            {hasSeeds ? "Tu perfil" : "Nueva acá"}
          </p>
          <p className="font-display text-xl font-bold tracking-tight md:text-2xl">
            Hola, {name}
          </p>
        </div>
      </div>

      {mosaic.length >= 4 ? (
        <div className="grid grid-cols-2 gap-1.5">
          {mosaic.map((c, i) => (
            <motion.div
              key={c.image + i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="relative aspect-square overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={`${c.artist} — ${c.title}`}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="aspect-[2/1] rounded-xl bg-gradient-to-br from-[var(--music-from)]/30 to-[var(--music-to)]/30" />
      )}

      <div className="mt-5">
        {hasSeeds ? (
          <>
            <p className="mb-2 text-xs tracking-wider uppercase text-muted-foreground">
              {seeds.length === 1 ? "Tu artista" : "Tus artistas"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {seeds.slice(0, 8).map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-xs"
                >
                  {s}
                </span>
              ))}
              {seeds.length > 8 && (
                <span className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground">
                  +{seeds.length - 8}
                </span>
              )}
            </div>
            <Link
              href="/feed"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-[var(--music-from)]"
            >
              Ir a mi feed <ArrowRight className="size-3.5" />
            </Link>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Configura tus artistas favoritos y arma tu feed personal de
            lanzamientos.
          </p>
        )}
      </div>
    </motion.div>
  );
}
