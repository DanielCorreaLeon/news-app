"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X } from "lucide-react";
import type { MusicPrefs } from "@/lib/types";

const SEED_ARTISTS = [
  "Bad Bunny",
  "Taylor Swift",
  "The Weeknd",
  "Drake",
  "Rosalía",
  "Arctic Monkeys",
  "Billie Eilish",
  "Dua Lipa",
  "Tyler, The Creator",
  "Rauw Alejandro",
  "Kendrick Lamar",
  "Karol G",
];

type Props = {
  prefs: MusicPrefs;
  onChange: (next: MusicPrefs) => void;
  accentFrom: string;
};

export function PrefsEditor({ prefs, onChange, accentFrom }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const add = (name: string) => {
    const n = name.trim();
    if (!n) return;
    if (prefs.likedArtists.some((a) => a.toLowerCase() === n.toLowerCase()))
      return;
    onChange({ ...prefs, likedArtists: [...prefs.likedArtists, n] });
  };

  const remove = (name: string) => {
    onChange({
      ...prefs,
      likedArtists: prefs.likedArtists.filter((a) => a !== name),
    });
  };

  const suggestions = SEED_ARTISTS.filter(
    (a) => !prefs.likedArtists.some((l) => l.toLowerCase() === a.toLowerCase()),
  ).slice(0, 8);

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4 md:p-5">
      <div className="mb-3 text-xs tracking-wider uppercase text-muted-foreground">
        Artistas que te inspiran
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {prefs.likedArtists.map((a) => (
            <motion.button
              key={a}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={() => remove(a)}
              className="group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-white shadow-sm transition-colors hover:bg-red-500/20"
              style={{
                borderColor: `color-mix(in oklch, ${accentFrom} 40%, transparent)`,
                background: `color-mix(in oklch, ${accentFrom} 18%, transparent)`,
              }}
            >
              {a}
              <X className="size-3 opacity-60 group-hover:opacity-100" />
            </motion.button>
          ))}
        </AnimatePresence>

        {adding ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft) add(draft);
              setDraft("");
              setAdding(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (draft) add(draft);
                setDraft("");
                setAdding(false);
              } else if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            placeholder="Nombre del artista"
            className="rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <Plus className="size-3" />
            Agregar
          </button>
        )}
      </div>

      {prefs.likedArtists.length === 0 && suggestions.length > 0 && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <div className="mb-2 text-xs text-muted-foreground">Sugerencias:</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground text-pretty">
        Los usamos como inspiración — vas a ver lanzamientos de ellos y de artistas similares.
      </p>
    </div>
  );
}
