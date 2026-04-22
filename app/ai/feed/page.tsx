"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { BentoGrid } from "@/components/bento-grid";
import { FeedSkeleton } from "@/components/feed-skeleton";
import { useAiPrefs } from "@/lib/preferences";
import type { FeedItem, NewsItem } from "@/lib/types";

const ACCENT_FROM = "oklch(0.78 0.17 220)";

export default function AiFeedPage() {
  const prefs = useAiPrefs();
  const hasPrefs = prefs.topics.length > 0 || prefs.toolsInUse.length > 0;

  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const topicsKey = prefs.topics.join(",");
  const toolsKey = prefs.toolsInUse.join(",");
  const focus = prefs.lastSession.focus ?? "";

  useEffect(() => {
    if (!hasPrefs) return;
    const controller = new AbortController();
    fetch(
      `/api/news/ai?topics=${encodeURIComponent(topicsKey)}&tools=${encodeURIComponent(toolsKey)}&focus=${encodeURIComponent(focus)}`,
      { signal: controller.signal },
    )
      .then(async (r) => {
        const data = (await r.json()) as {
          items?: NewsItem[];
          error?: string;
        };
        if (data.error) setError(data.error);
        setItems((data.items ?? []).map((n) => ({ kind: "news", ...n })));
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "error");
        setItems([]);
      });
    return () => controller.abort();
  }, [hasPrefs, topicsKey, toolsKey, focus, refreshKey]);

  const handleRefresh = () => {
    setItems(null);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <header className="mb-8 flex items-center justify-between">
        <Link
          href="/ai"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Volver al chat
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
          Novedades · IA
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tighter md:text-6xl">
          Lo último en IA
        </h1>
      </motion.div>

      {!hasPrefs && (
        <EmptyState
          title="Elegí qué te interesa primero"
          body="Volvé al chat y seleccioná al menos un tópico (modelos, agentes, coding, etc.)."
          ctaHref="/ai"
          ctaLabel="Ir al chat"
        />
      )}

      {hasPrefs && items === null && <FeedSkeleton accentFrom={ACCENT_FROM} />}

      {hasPrefs && items && items.length === 0 && !error && (
        <EmptyState
          title="Sin noticias"
          body="No encontré novedades para tus tópicos esta semana. Probá ampliar."
          ctaHref="/ai"
          ctaLabel="Editar tópicos"
        />
      )}

      {hasPrefs && items && items.length > 0 && (
        <BentoGrid items={items} accentFrom={ACCENT_FROM} />
      )}

      {error && (
        <p className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          No pude traer noticias: {error}. Chequeá tu{" "}
          <code className="rounded bg-black/20 px-1">NEWS_API_KEY</code>.
        </p>
      )}
    </main>
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
      <p className="mt-2 text-muted-foreground">{body}</p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-transform hover:scale-105"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
