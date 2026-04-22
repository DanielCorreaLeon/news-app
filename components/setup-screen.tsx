"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import type { AiPrefs, Category, MusicPrefs } from "@/lib/types";
import { PrefsEditor } from "./prefs-editor";

type Props = {
  category: Category;
  prefs: MusicPrefs | AiPrefs;
  title: string;
  eyebrow: string;
  accentFrom: string;
  accentTo: string;
  feedHref: string;
  onPrefsChange: (next: MusicPrefs | AiPrefs) => void;
};

export function SetupScreen({
  category,
  prefs,
  title,
  eyebrow,
  accentFrom,
  accentTo,
  feedHref,
  onPrefsChange,
}: Props) {
  const [note, setNote] = useState("");

  const hasEnoughPrefs =
    category === "music"
      ? (prefs as MusicPrefs).likedArtists.length > 0
      : (prefs as AiPrefs).topics.length > 0 ||
        (prefs as AiPrefs).toolsInUse.length > 0;

  const intro = (() => {
    if (category === "music") {
      const p = prefs as MusicPrefs;
      if (p.likedArtists.length === 0) {
        return "Agregá algunos artistas que te gusten y armamos tu feed de lanzamientos.";
      }
      return `Ya tenemos tus artistas. Si querés ajustar algo, editalo acá abajo.`;
    }
    const p = prefs as AiPrefs;
    if (p.topics.length === 0 && p.toolsInUse.length === 0) {
      return "Elegí qué te interesa y qué tools usás — con eso filtramos las novedades.";
    }
    return "Ajustá tópicos o tools si querés refinar el feed de hoy.";
  })();

  const handleSaveNote = () => {
    if (!note.trim()) return;
    if (category === "music") {
      const p = prefs as MusicPrefs;
      onPrefsChange({
        ...p,
        lastSession: { ...p.lastSession, listening: note.trim() },
      });
    } else {
      const p = prefs as AiPrefs;
      onPrefsChange({
        ...p,
        lastSession: { ...p.lastSession, focus: note.trim() },
      });
    }
    setNote("");
  };

  const savedNote =
    category === "music"
      ? (prefs as MusicPrefs).lastSession.listening
      : (prefs as AiPrefs).lastSession.focus;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-32 md:px-6">
      <header className="flex items-center justify-between py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Volver
        </Link>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground text-pretty md:text-lg">
          {intro}
        </p>
      </motion.div>

      <div className="space-y-4">
        <PrefsEditor
          category={category}
          prefs={prefs}
          onChange={onPrefsChange}
          accentFrom={accentFrom}
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card/40 p-4"
        >
          <label className="mb-2 block text-xs tracking-wider uppercase text-muted-foreground">
            {category === "music"
              ? "¿Qué estás escuchando hoy? (opcional)"
              : "¿Algo puntual que querés ver hoy? (opcional)"}
          </label>
          <div className="flex items-center gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveNote();
                }
              }}
              placeholder={
                category === "music"
                  ? savedNote ?? "Un álbum, un vibe, un género…"
                  : savedNote ?? "Ej: agentes open source, Claude 4.7, etc."
              }
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSaveNote}
              disabled={!note.trim()}
              className="rounded-full border border-border px-3 py-2 text-sm transition-colors hover:border-foreground/40 disabled:opacity-40"
            >
              Guardar
            </button>
          </div>
          {savedNote && !note && (
            <p className="mt-2 text-xs text-muted-foreground">
              Ahora: <span className="text-foreground">{savedNote}</span>
            </p>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-10"
      >
        <Link
          href={hasEnoughPrefs ? feedHref : "#"}
          onClick={(e) => {
            if (!hasEnoughPrefs) e.preventDefault();
          }}
          className={`group flex items-center justify-between rounded-3xl p-6 text-white shadow-2xl transition-transform ${
            hasEnoughPrefs
              ? "hover:scale-[1.02]"
              : "cursor-not-allowed opacity-50"
          }`}
          style={{
            background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
          }}
        >
          <div>
            <p className="text-xs tracking-widest uppercase opacity-80">
              {hasEnoughPrefs ? "Todo listo" : "Agregá algo arriba"}
            </p>
            <p className="font-display text-2xl font-bold md:text-3xl">
              Ver mi feed
            </p>
          </div>
          <div className="rounded-full bg-white/15 p-3 backdrop-blur transition-transform group-hover:translate-x-1">
            <ArrowRight className="size-6" strokeWidth={2.5} />
          </div>
        </Link>
      </motion.div>
    </main>
  );
}
