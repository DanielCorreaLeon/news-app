"use client";

import { SetupScreen } from "@/components/setup-screen";
import { setMusicPrefs, useMusicPrefs } from "@/lib/preferences";
import type { MusicPrefs } from "@/lib/types";

export default function MusicSetupPage() {
  const prefs = useMusicPrefs();

  return (
    <SetupScreen
      category="music"
      prefs={prefs}
      title="Tu música hoy"
      eyebrow="Lanzamientos · Música"
      accentFrom="oklch(0.72 0.25 330)"
      accentTo="oklch(0.62 0.22 290)"
      feedHref="/music/feed"
      onPrefsChange={(next) => {
        setMusicPrefs(next as MusicPrefs);
      }}
    />
  );
}
