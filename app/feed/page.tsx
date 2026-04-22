"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { BentoGrid } from "@/components/bento-grid";
import { FeedSkeleton } from "@/components/feed-skeleton";
import { useMusicPrefs } from "@/lib/preferences";
import type { MusicItem } from "@/lib/types";

const ACCENT_FROM = "oklch(0.72 0.25 330)";

export default function FeedPage() {
  const prefs = useMusicPrefs();
  const hasPrefs = prefs.likedArtists.length > 0;

  const [items, setItems] = useState<MusicItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const likedKey = prefs.likedArtists.join(",");
  const dislikedKey = prefs.dislikedArtists.join(",");
  const listening = prefs.lastSession.listening ?? "";

  useEffect(() => {
    if (!hasPrefs) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      artists: likedKey,
      exclude: dislikedKey,
      listening,
    });
    fetch(`/api/news/music?${params}`, { signal: controller.signal })
      .then(async (r) => {
        const data = (await r.json()) as {
          items?: MusicItem[];
          error?: string;
        };
        if (data.error) setError(data.error);
        setItems(data.items ?? []);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "error");
        setItems([]);
      });
    return () => controller.abort();
  }, [hasPrefs, likedKey, dislikedKey, listening, refreshKey]);

  const handleRefresh = () => {
    setItems(null);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  const counts = items ? groupBySource(items) : null;
  const year = new Date().getFullYear();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8 flex items-center justify-between">
        <Link
          href="/setup"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Editar
        </Link>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Actualizar
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Lanzamientos de {year}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tighter md:text-6xl">
          Tu feed musical
        </h1>
        {counts && (
          <p className="mt-3 text-sm text-muted-foreground">
            {counts.seed} de tus artistas
            {counts.similar > 0 ? ` · ${counts.similar} similares` : ""}
            {counts.listening > 0
              ? ` · ${counts.listening} de lo que escuchás hoy`
              : ""}
          </p>
        )}
      </motion.div>

      {!hasPrefs && (
        <EmptyState
          title="Agregá tus artistas primero"
          body="Volvé al inicio y elegí al menos un artista que te guste."
          ctaHref="/setup"
          ctaLabel="Ir al setup"
        />
      )}

      {hasPrefs && items === null && <FeedSkeleton accentFrom={ACCENT_FROM} />}

      {hasPrefs && items && items.length === 0 && !error && (
        <EmptyState
          title={`Nada fresco en ${year} todavía`}
          body="Tus artistas no sacaron nada este año aún, y la búsqueda similar no trajo nada. Probá agregar más artistas o contar qué estás escuchando hoy."
          ctaHref="/setup"
          ctaLabel="Editar"
        />
      )}

      {hasPrefs && items && items.length > 0 && (
        <BentoGrid items={items} accentFrom={ACCENT_FROM} />
      )}

      {error && (
        <p className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          No pude traer los lanzamientos: {error}. Chequeá las claves de Spotify en{" "}
          <code className="rounded bg-black/20 px-1">.env.local</code>.
        </p>
      )}
    </main>
  );
}

function groupBySource(items: MusicItem[]) {
  return items.reduce(
    (acc, it) => {
      acc[it.source]++;
      return acc;
    },
    { seed: 0, similar: 0, listening: 0 },
  );
}

function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card/40 p-10 text-center">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-muted-foreground text-pretty">{body}</p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-transform hover:scale-105"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
