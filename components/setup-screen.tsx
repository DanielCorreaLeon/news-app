"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { MusicPrefs } from "@/lib/types";
import { PrefsEditor } from "./prefs-editor";

type Props = {
  prefs: MusicPrefs;
  accentFrom: string;
  accentTo: string;
  feedHref: string;
  onPrefsChange: (next: MusicPrefs) => void;
};

export function SetupScreen({
  prefs,
  accentFrom,
  accentTo,
  feedHref,
  onPrefsChange,
}: Props) {
  const [note, setNote] = useState("");

  const hasSeeds = prefs.likedArtists.length > 0;
  const savedNote = prefs.lastSession.listening;

  const handleSaveNote = () => {
    if (!note.trim()) return;
    onPrefsChange({
      ...prefs,
      lastSession: { ...prefs.lastSession, listening: note.trim() },
    });
    setNote("");
  };

  const clearNote = () => {
    onPrefsChange({
      ...prefs,
      lastSession: { ...prefs.lastSession, listening: undefined },
    });
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-32 md:px-6">
      <header className="flex items-center gap-2 py-6">
        <div className="relative">
          <span className="block size-2.5 rounded-full bg-[var(--music-from)]" />
          <span className="absolute inset-0 size-2.5 animate-ping rounded-full bg-[var(--music-from)] opacity-60" />
        </div>
        <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-foreground/80">
          Daily
        </span>
        <span className="ml-auto hidden text-xs tracking-widest uppercase text-muted-foreground md:inline">
          {new Intl.DateTimeFormat("es", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })
            .format(new Date())
            .toUpperCase()}
        </span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 mt-4"
      >
        <p className="mb-3 text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Tu música hoy
        </p>
        <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-tighter text-balance md:text-7xl">
          Nuevos{" "}
          <span className="bg-gradient-to-r from-[var(--music-from)] via-[var(--music-to)] to-[oklch(0.6_0.2_240)] bg-clip-text text-transparent">
            lanzamientos
          </span>
          , inspirados en ti.
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground text-pretty md:text-lg">
          Cuéntanos qué artistas te gustan y qué estás escuchando hoy. Te armamos
          un feed con los últimos lanzamientos, de tus artistas y de otros que
          suenan parecido.
        </p>
      </motion.div>

      <div className="space-y-4">
        <PrefsEditor
          prefs={prefs}
          onChange={onPrefsChange}
          accentFrom={accentFrom}
        />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card/40 p-4 md:p-5"
        >
          <label className="mb-2 block text-xs tracking-wider uppercase text-muted-foreground">
            ¿Qué estás escuchando hoy?{" "}
            <span className="lowercase text-foreground/40">
              (opcional, pero ayuda)
            </span>
          </label>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
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
                savedNote ?? "un género, un álbum, un estilo, un artista nuevo…"
              }
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSaveNote}
              disabled={!note.trim()}
              className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/40 disabled:opacity-40"
            >
              Guardar
            </button>
          </div>
          {savedNote && !note && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Hoy:</span>
              <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-foreground">
                {savedNote}
              </span>
              <button
                onClick={clearNote}
                className="ml-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                limpiar
              </button>
            </div>
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
          href={hasSeeds ? feedHref : "#"}
          onClick={(e) => {
            if (!hasSeeds) e.preventDefault();
          }}
          className={`group flex items-center justify-between rounded-3xl p-6 text-white shadow-2xl transition-transform md:p-8 ${
            hasSeeds ? "hover:scale-[1.02]" : "cursor-not-allowed opacity-50"
          }`}
          style={{
            background: `linear-gradient(135deg, ${accentFrom}, ${accentTo})`,
          }}
        >
          <div>
            <p className="text-xs tracking-widest uppercase opacity-80">
              {hasSeeds ? "Todo listo" : "Agrega al menos un artista"}
            </p>
            <p className="font-display text-3xl font-bold md:text-4xl">
              Ver mi feed
            </p>
          </div>
          <div className="rounded-full bg-white/15 p-3 backdrop-blur transition-transform group-hover:translate-x-1">
            <ArrowRight className="size-6" strokeWidth={2.5} />
          </div>
        </Link>
      </motion.div>

      <footer className="mt-auto pt-16 text-xs text-muted-foreground">
        Tus preferencias viven en tu navegador. Nada se sube a un servidor.
      </footer>
    </main>
  );
}
